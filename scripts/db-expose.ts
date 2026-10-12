import { databaseClient } from './database-client'

// Project Data API configuration is a separate operation from schema migrations.
// Append only this application; preserve every schema already exposed by YQYHub.
const client = await databaseClient()
try {
  await client.connect()
  await client.query('begin')
  await client.query("select pg_advisory_xact_lock(hashtext('naruto_spiritism:api-config'))")
  const result = await client.query<{ setting: string }>(
    "select unnest(setconfig) as setting from pg_db_role_setting where setrole = (select oid from pg_roles where rolname='authenticator') and setdatabase=0",
  )
  const setting = result.rows.find((r) => r.setting.startsWith('pgrst.db_schemas='))?.setting
  if (!setting)
    throw Error(
      'No existing pgrst.db_schemas role setting found; configure Data API exposed schemas in Supabase settings.',
    )
  const schemas = setting
    .slice('pgrst.db_schemas='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!schemas.includes('naruto_spiritism')) {
    schemas.push('naruto_spiritism')
    const value = schemas.join(', ').replaceAll("'", "''")
    await client.query(`alter role authenticator set pgrst.db_schemas = '${value}'`)
    await client.query("notify pgrst, 'reload config'")
    await client.query("notify pgrst, 'reload schema'")
  }
  await client.query('commit')
  console.log('Data API exposed schemas:', schemas.join(', '))
} catch (error) {
  await client.query('rollback').catch(() => {})
  console.error(error instanceof Error ? error.message : 'Data API configuration failed')
  process.exitCode = 1
} finally {
  await client.end()
}
