import assert from 'node:assert/strict'
import { databaseClient } from './database-client'
import { parseCatalog } from '../app/domain/catalog'
import { SEALS, JUTSUS } from '../supabase/seed/catalog'
import { NINJAS } from '../supabase/seed/ninjas'

const apiUrl = process.env.SUPABASE_URL
const key = process.env.SUPABASE_PUBLISHABLE_KEY
if (!apiUrl || !key) throw Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.')
const headers = {
  apikey: key,
  'Content-Profile': 'naruto_spiritism',
  'Content-Type': 'application/json',
}
const response = await fetch(`${apiUrl}/rest/v1/rpc/get_catalog`, {
  method: 'POST',
  headers,
  body: '{}',
  signal: AbortSignal.timeout(15000),
})
assert.equal(response.status, 200)
assert.deepEqual(parseCatalog(await response.json()), {
  seals: SEALS,
  jutsus: JUTSUS,
  ninjas: NINJAS,
})
for (const [name, args] of Object.entries({
  get_my_state: {},
  record_cast: { jutsu_id: 'fireball', request_id: crypto.randomUUID() },
  select_companion: { ninja_id: 'ninja-01' },
  ensure_player: {},
  player_snapshot: { player_id: crypto.randomUUID() },
})) {
  const denied: Response = await fetch(`${apiUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(15000),
  })
  assert.ok(
    [401, 403, 404].includes(denied.status),
    `Anonymous RPC ${name} must be denied; HTTP ${denied.status}`,
  )
}
const client = await databaseClient()
try {
  await client.connect()
  await client.query('begin read only')
  const tables = await client.query<{
    name: string
    rls: boolean
    anon_read: boolean
    auth_read: boolean
    anon_write: boolean
    auth_write: boolean
  }>(`select c.relname as name, c.relrowsecurity as rls,
    has_table_privilege('anon',c.oid,'SELECT') as anon_read, has_table_privilege('authenticated',c.oid,'SELECT') as auth_read,
    has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') as anon_write,
    has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') as auth_write
    from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='naruto_spiritism' and c.relkind='r'`)
  const publicTables = ['seals', 'jutsus', 'jutsu_seals', 'ninjas', 'ninja_unlock_jutsus']
  assert.equal(tables.rowCount, 10) // 9 business tables + the private migration ledger.
  for (const table of tables.rows) {
    assert.equal(table.rls, true, `${table.name} RLS`)
    assert.equal(table.anon_write, false, `${table.name} anonymous writes`)
    assert.equal(table.auth_write, false, `${table.name} direct account writes`)
    assert.equal(table.anon_read, publicTables.includes(table.name), `${table.name} guest reads`)
    assert.equal(table.auth_read, table.name !== 'schema_migrations', `${table.name} account reads`)
  }
  const functions = await client.query<{
    name: string
    anon: boolean
    authenticated: boolean
    public_execute: boolean
    config: string[]
  }>(`select p.proname as name, p.proconfig as config,
    has_function_privilege('anon',p.oid,'EXECUTE') as anon,
    has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated,
    exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE') as public_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='naruto_spiritism'`)
  for (const fn of functions.rows) {
    assert.equal(fn.public_execute, false, `${fn.name} PUBLIC execute`)
    assert.equal(fn.anon, fn.name === 'get_catalog', `${fn.name} guest execute`)
    assert.equal(
      fn.authenticated,
      ['get_catalog', 'get_my_state', 'record_cast', 'select_companion'].includes(fn.name),
      `${fn.name} account execute`,
    )
    assert.ok(
      fn.config?.some((value) => value.startsWith('search_path=')),
      `${fn.name} fixed search_path`,
    )
  }
  await client.query('rollback')
  console.log(
    'Verified real YQYHub catalog, guest RPC isolation, RLS and table/function grants. No personal data changed.',
  )
} finally {
  await client.end()
}
