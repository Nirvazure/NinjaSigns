import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { expect, it } from 'vitest'

it('console audit passes the current grants and reports missing, exposed and unprotected objects', async () => {
  const db = await PGlite.create()
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`)
    await db.exec(
      await readFile(
        new URL('../../supabase/migrations/202610120001_schema.sql', import.meta.url),
        'utf8',
      ),
    )
    await db.exec(`create table naruto_spiritism.schema_migrations(name text primary key, checksum text not null, applied_at timestamptz default now());
      alter table naruto_spiritism.schema_migrations enable row level security;
      revoke all on naruto_spiritism.schema_migrations from public, anon, authenticated;`)
    const sql = await readFile(
      new URL('../../supabase/maintenance/verify-permissions.sql', import.meta.url),
      'utf8',
    )
    const audit = async () => (await db.exec(sql)).flatMap((result) => result.rows)
    expect(await audit()).toEqual([])
    await db.exec(`alter table naruto_spiritism.profiles disable row level security;
      grant execute on function naruto_spiritism.get_my_state() to anon;
      create table naruto_spiritism.unexpected(id int);
      drop table naruto_spiritism.schema_migrations;`)
    expect(await audit()).toEqual(
      expect.arrayContaining([
        { kind: 'table', object_name: 'profiles', failure: 'RLS disabled' },
        { kind: 'table', object_name: 'unexpected', failure: 'unexpected table' },
        { kind: 'table', object_name: 'schema_migrations', failure: 'missing table' },
        { kind: 'function', object_name: 'get_my_state()', failure: 'guest execute mismatch' },
      ]),
    )
  } finally {
    await db.close()
  }
}, 30000)
