import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { databaseClient } from './database-client'

const client = await databaseClient()
try {
  await client.connect()
  await client.query('begin')
  await client.query("select pg_advisory_xact_lock(hashtext('naruto_spiritism:migrations'))")
  await client.query('create schema if not exists naruto_spiritism')
  await client.query(
    'create table if not exists naruto_spiritism.schema_migrations (name text primary key, checksum text not null, applied_at timestamptz not null default now())',
  )
  for (const file of (await readdir('supabase/migrations'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const sql = await readFile(`supabase/migrations/${file}`, 'utf8')
    const checksum = createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex')
    const done = await client.query(
      'select checksum from naruto_spiritism.schema_migrations where name=$1',
      [file],
    )
    if (done.rowCount) {
      if (done.rows[0].checksum !== checksum)
        throw Error(`Applied migration changed: ${file}. Create a new migration instead.`)
      continue
    }
    await client.query(sql)
    await client.query(
      'insert into naruto_spiritism.schema_migrations(name, checksum) values($1,$2)',
      [file, checksum],
    )
    console.log(`Applied ${file}`)
  }
  await client.query('alter table naruto_spiritism.schema_migrations enable row level security')
  await client.query(
    'revoke all on naruto_spiritism.schema_migrations from public, anon, authenticated',
  )
  await client.query('commit')
  console.log('naruto_spiritism migrations committed.')
} catch (error) {
  await client.query('rollback').catch(() => {})
  console.error(error instanceof Error ? error.message : 'Migration failed')
  process.exitCode = 1
} finally {
  await client.end()
}
