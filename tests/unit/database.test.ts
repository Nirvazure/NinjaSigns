import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { buildSeed } from '../../supabase/seed/build'
import { JUTSUS } from '../../supabase/seed/catalog'

let db: PGlite
const a = '00000000-0000-0000-0000-000000000001'
const b = '00000000-0000-0000-0000-000000000002'
type State = {
  userId: string
  version: number
  mastery: Record<string, { casts: number }>
  unlockedIds: string[]
  companionId: string
}
async function asUser(id: string | null, sql: string) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${id ? 'authenticated' : 'anon'};`)
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [id ?? ''])
    return tx.query<{ result: State }>(sql)
  })
}
async function cast(id: string, jutsu: string, request = crypto.randomUUID()) {
  const result = await asUser(
    id,
    `select naruto_spiritism.record_cast('${jutsu}', '${request}') as result`,
  )
  return result.rows[0]!.result as unknown as { state: State; newlyUnlocked: string[] }
}
beforeAll(async () => {
  db = await PGlite.create()
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users(id, email) values ('${a}', 'a@example.com'), ('${b}', 'b@example.com');`)
  await db.exec(
    await readFile(
      new URL('../../supabase/migrations/202610120001_schema.sql', import.meta.url),
      'utf8',
    ),
  )
  await db.exec(buildSeed())
}, 30000)
afterAll(async () => {
  await db?.close()
})
describe('real PostgreSQL permissions and transactions', () => {
  it('exposes all ordered catalog data to guests, including repeated seals', async () => {
    const response = await asUser(null, 'select naruto_spiritism.get_catalog() as result')
    const catalog = response.rows[0]!.result as unknown as {
      seals: unknown[]
      jutsus: { id: string; sequence: string[] }[]
      ninjas: unknown[]
    }
    expect(catalog.seals).toHaveLength(12)
    expect(catalog.jutsus).toHaveLength(28)
    expect(catalog.ninjas).toHaveLength(25)
    expect(catalog.jutsus.find((j) => j.id === 'water-bullet')?.sequence).toEqual([
      'tiger',
      'ox',
      'tiger',
      'rat',
    ])
  })
  it('initializes existing shared Auth accounts independently', async () => {
    for (const id of [a, b]) {
      const response = await asUser(id, 'select naruto_spiritism.get_my_state() as result')
      expect(response.rows[0]!.result).toMatchObject({
        userId: id,
        mastery: {},
        unlockedIds: ['ninja-01'],
        companionId: 'ninja-01',
      })
    }
  })
  it('denies guest private reads and all player writes', async () => {
    await expect(asUser(null, 'select * from naruto_spiritism.profiles')).rejects.toThrow(
      /permission denied/,
    )
    await expect(asUser(null, 'select naruto_spiritism.get_my_state() as result')).rejects.toThrow(
      /permission denied/,
    )
    await expect(
      asUser(a, `update naruto_spiritism.user_jutsu_progress set casts=999`),
    ).rejects.toThrow(/permission denied/)
    await expect(asUser(a, `update naruto_spiritism.jutsus set attack_power=0`)).rejects.toThrow(
      /permission denied/,
    )
  })
  it('counts request retries once and prevents reuse for another jutsu', async () => {
    const request = crypto.randomUUID()
    const first = await cast(a, 'fireball', request)
    const again = await cast(a, 'fireball', request)
    expect(first.state.mastery.fireball?.casts).toBe(1)
    expect(again.state.mastery.fireball?.casts).toBe(1)
    expect(first.newlyUnlocked).toEqual(['ninja-02'])
    expect(again.newlyUnlocked).toEqual(['ninja-02'])
    await expect(cast(a, 'chidori', request)).rejects.toThrow(/request_id/)
  })
  it('isolates reads and rejects locked companion selection', async () => {
    const response = await asUser(b, 'select * from naruto_spiritism.user_jutsu_progress')
    expect(response.rows).toEqual([])
    await expect(
      asUser(b, "select naruto_spiritism.select_companion('ninja-02') as result"),
    ).rejects.toThrow(/未解锁/)
    const responseA = await asUser(
      a,
      "select naruto_spiritism.select_companion('ninja-02') as result",
    )
    expect(responseA.rows[0]!.result.companionId).toBe('ninja-02')
  })
  it('unlocks combinations and counts distinct mastered jutsu, not repetitions', async () => {
    await cast(b, 'added-weight-rock')
    const combo = await cast(b, 'dropping-lid')
    expect(combo.newlyUnlocked).toContain('ninja-04')
    for (let i = 0; i < 5; i++) await cast(b, 'dropping-lid')
    let response = await cast(b, 'fireball')
    expect(response.state.unlockedIds).not.toContain('ninja-14')
    response = await cast(b, 'chidori')
    expect(response.state.unlockedIds).toContain('ninja-14')
    expect(response.state.mastery['dropping-lid']?.casts).toBe(6)
  })
  it('unlocks all 25 seeded ninjas when all 28 jutsu are mastered', async () => {
    let result
    for (const jutsu of JUTSUS) result = await cast(b, jutsu.id)
    expect(result!.state.unlockedIds).toHaveLength(25)
    expect(Object.keys(result!.state.mastery)).toHaveLength(28)
  })
  it('keeps internal helpers inaccessible through the Data API', async () => {
    await expect(
      asUser(b, `select naruto_spiritism.player_snapshot('${a}') as result`),
    ).rejects.toThrow(/permission denied/)
    await expect(asUser(b, 'select naruto_spiritism.ensure_player()')).rejects.toThrow(
      /permission denied/,
    )
  })
  it('rejects unknown IDs and cascades private data when an Auth user is deleted', async () => {
    await expect(cast(a, 'unknown')).rejects.toThrow(/忍术/)
    await db.query('delete from auth.users where id=$1', [a])
    const response = await db.query('select * from naruto_spiritism.cast_events where user_id=$1', [
      a,
    ])
    expect(response.rows).toEqual([])
  })
})
