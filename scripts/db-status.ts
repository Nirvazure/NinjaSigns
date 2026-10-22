import { databaseClient } from './database-client'

const apiUrl = process.env.SUPABASE_URL
const key = process.env.SUPABASE_PUBLISHABLE_KEY
if (!apiUrl || !key) throw Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.')
const auth = await fetch(`${apiUrl}/auth/v1/settings`, {
  headers: { apikey: key },
  signal: AbortSignal.timeout(15000),
})
const settings = await auth.json()
console.log('Auth settings HTTP:', auth.status, 'GitHub enabled:', settings.external?.github)
const catalogResponse = await fetch(`${apiUrl}/rest/v1/rpc/get_catalog`, {
  method: 'POST',
  headers: {
    apikey: key,
    'Content-Profile': 'naruto_spiritism',
    'Content-Type': 'application/json',
  },
  body: '{}',
  signal: AbortSignal.timeout(15000),
})
const catalog = await catalogResponse.json()
console.log(
  'Data API HTTP:',
  catalogResponse.status,
  catalogResponse.ok
    ? {
        seals: catalog.seals?.length,
        jutsus: catalog.jutsus?.length,
        ninjas: catalog.ninjas?.length,
      }
    : { code: catalog.code, message: catalog.message },
)
if (process.env.DIRECT_DATABASE_URL) {
  const client = await databaseClient()
  try {
    await client.connect()
    const schemas = await client.query(
      "select schema_name from information_schema.schemata where schema_name in ('naruto_spiritism','artmind','rapperank') order by schema_name",
    )
    console.log(
      'Application schemas:',
      schemas.rows.map((r) => r.schema_name),
    )
    const api = await client.query(
      "select unnest(setconfig) as setting from pg_db_role_setting where setrole = (select oid from pg_roles where rolname='authenticator')",
    )
    console.log(
      'PostgREST schema settings:',
      api.rows.filter((r) => r.setting.startsWith('pgrst.db_schemas=')),
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Database status failed')
    process.exitCode = 1
  } finally {
    await client.end()
  }
}
if (!auth.ok || !settings.external?.github || !catalogResponse.ok) process.exitCode = 1
