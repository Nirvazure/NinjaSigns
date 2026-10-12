import assert from 'node:assert/strict'
import { databaseClient } from './database-client'
import type { CastResult, PlayerState } from '../app/domain/player-session'

// Exercise existing shared identities in one ROLLBACK-only transaction.
// No Auth users are created, and no test progress/profile/unlock survives.
const client = await databaseClient()
const requestIds = [crypto.randomUUID(), crypto.randomUUID()]
const concurrentRequest = crypto.randomUUID()
async function verifySerialization(accountId: string) {
  const contender = await databaseClient()
  try {
    await contender.connect()
    const blockerPid = (await client.query<{ pid: number }>('select pg_backend_pid() as pid'))
      .rows[0]!.pid
    const contenderPid = (await contender.query<{ pid: number }>('select pg_backend_pid() as pid'))
      .rows[0]!.pid
    await client.query('begin')
    await client.query('set local role authenticated')
    await client.query("select set_config('request.jwt.claim.sub',$1,true)", [accountId])
    const current = (
      await client.query<{ state: PlayerState }>('select naruto_spiritism.get_my_state() as state')
    ).rows[0]!.state
    await contender.query('begin')
    await contender.query('set local role authenticated')
    await contender.query("select set_config('request.jwt.claim.sub',$1,true)", [accountId])
    // Capture rejection immediately while inspecting the database's lock wait.
    const pending = contender
      .query<{ result: CastResult }>('select naruto_spiritism.record_cast($1,$2) as result', [
        'fireball',
        concurrentRequest,
      ])
      .then(
        (result) => ({ result }),
        (error: unknown) => ({ error }),
      )
    let blocked = false
    for (let attempt = 0; attempt < 30; attempt++) {
      const locks = await client.query<{ blockers: number[] }>(
        'select pg_blocking_pids($1) as blockers',
        [contenderPid],
      )
      if (locks.rows[0]!.blockers.includes(blockerPid)) {
        blocked = true
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await client.query('rollback')
    const outcome = await pending
    assert.ok(blocked, 'A concurrent cast must wait for the account transaction lock.')
    if ('error' in outcome) throw outcome.error
    assert.equal(
      outcome.result.rows[0]!.result.state.mastery.fireball!.casts,
      (current.mastery.fireball?.casts || 0) + 1,
    )
    await contender.query('rollback')
    assert.equal(
      (
        await client.query('select * from naruto_spiritism.cast_events where request_id=$1', [
          concurrentRequest,
        ])
      ).rowCount,
      0,
    )
  } finally {
    await client.query('rollback').catch(() => {})
    await contender.query('rollback').catch(() => {})
    await contender.end()
  }
}
try {
  await client.connect()
  const users = await client.query<{ id: string }>(
    'select id from auth.users order by created_at limit 2',
  )
  assert.equal(
    users.rowCount,
    2,
    'Two existing shared Auth accounts are required for this integration check.',
  )
  await client.query('begin')
  await client.query('set local role authenticated')
  const accountA = users.rows[0]!.id,
    accountB = users.rows[1]!.id
  await client.query("select set_config('request.jwt.claim.sub',$1,true)", [accountA])
  const before = (
    await client.query<{ state: PlayerState }>('select naruto_spiritism.get_my_state() as state')
  ).rows[0]!.state
  const runCast = async (requestId: string) =>
    (
      await client.query<{ result: CastResult }>(
        'select naruto_spiritism.record_cast($1,$2) as result',
        ['fireball', requestId],
      )
    ).rows[0]!.result
  const first = await runCast(requestIds[0]!)
  const repeated = await runCast(requestIds[0]!)
  assert.deepEqual(first, repeated)
  assert.equal(first.state.mastery.fireball!.casts, (before.mastery.fireball?.casts || 0) + 1)
  assert.equal(first.state.version, before.version + 1)
  assert.ok(first.state.unlockedIds.includes('ninja-02'))
  const second = await runCast(requestIds[1]!)
  assert.equal(second.state.mastery.fireball!.casts, first.state.mastery.fireball!.casts + 1)
  const chosen = (
    await client.query<{ state: PlayerState }>(
      "select naruto_spiritism.select_companion('ninja-02') as state",
    )
  ).rows[0]!.state
  assert.equal(chosen.companionId, 'ninja-02')
  assert.equal(chosen.version, second.state.version + 1)
  await client.query("select set_config('request.jwt.claim.sub',$1,true)", [accountB])
  assert.equal(
    (await client.query('select * from naruto_spiritism.profiles where id=$1', [accountA]))
      .rowCount,
    0,
  )
  assert.equal(
    (
      await client.query('select * from naruto_spiritism.user_jutsu_progress where user_id=$1', [
        accountA,
      ])
    ).rowCount,
    0,
  )
  assert.equal(
    (
      await client.query(
        'select * from naruto_spiritism.cast_events where request_id=any($1::uuid[])',
        [requestIds],
      )
    ).rowCount,
    0,
  )
  const other = (
    await client.query<{ state: PlayerState }>('select naruto_spiritism.get_my_state() as state')
  ).rows[0]!.state
  assert.equal(other.userId, accountB)
  await client.query('rollback')
  assert.equal(
    (
      await client.query(
        'select * from naruto_spiritism.cast_events where request_id=any($1::uuid[])',
        [requestIds],
      )
    ).rowCount,
    0,
  )
  await verifySerialization(accountA)
  console.log(
    'Real shared-identity RPC initialization, idempotence, counts, companion selection, state versions, A/B RLS and concurrent account locking verified; all test transactions rolled back.',
  )
} catch (error) {
  await client.query('rollback').catch(() => {})
  console.error(error instanceof Error ? error.message : 'Transaction verification failed')
  process.exitCode = 1
} finally {
  await client.end()
}
