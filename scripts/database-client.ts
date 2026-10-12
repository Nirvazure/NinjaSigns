import pg from 'pg'
import { databaseCaPath } from './database-ca'

/** Migration/admin scripts only. Never imported by the Nuxt application. */
export async function databaseClient() {
  if (!process.env.DIRECT_DATABASE_URL)
    throw Error('DIRECT_DATABASE_URL is required; use a session pooler connection (5432).')
  const url = new URL(process.env.DIRECT_DATABASE_URL)
  url.searchParams.set('sslmode', 'verify-full')
  url.searchParams.set('sslrootcert', await databaseCaPath())
  return new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 15000,
    statement_timeout: 60000,
  })
}
