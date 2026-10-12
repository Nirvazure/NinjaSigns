import { PGlite } from '@electric-sql/pglite'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { format } from 'prettier'

const db = await PGlite.create()
await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`)
for (const file of (await readdir('supabase/migrations'))
  .filter((name) => name.endsWith('.sql'))
  .sort()) {
  await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'))
}
const columns = await db.query<{
  table_name: string
  column_name: string
  udt_name: string
  is_nullable: string
  column_default: string | null
}>(
  "select table_name,column_name,udt_name,is_nullable,column_default from information_schema.columns where table_schema='naruto_spiritism' order by table_name,ordinal_position",
)
const type = (name: string) =>
  ['int4', 'int8', 'float4', 'float8', 'numeric'].includes(name)
    ? 'number'
    : name === 'bool'
      ? 'boolean'
      : name === 'jsonb'
        ? 'Json'
        : 'string'
const tables = [...new Set(columns.rows.map((c) => c.table_name))]
  .map((table) => {
    const fields = columns.rows.filter((c) => c.table_name === table)
    const shape = (kind: string) =>
      fields
        .map(
          (c) =>
            `${c.column_name}${kind === 'Update' || (kind === 'Insert' && (c.column_default !== null || c.is_nullable === 'YES')) ? '?' : ''}: ${type(c.udt_name)}${c.is_nullable === 'YES' ? ' | null' : ''}`,
        )
        .join('; ')
    return `${table}: { Row: { ${shape('Row')} }; Insert: { ${shape('Insert')} }; Update: { ${shape('Update')} }; Relationships: [] }`
  })
  .join('\n')
await mkdir('app/types', { recursive: true })
await writeFile(
  'app/types/database.types.ts',
  await format(
    `// Generated from all isolated PostgreSQL migrations by yarn db:generate.\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]\nexport type Database = { naruto_spiritism: {\nTables: {\n${tables}\n}; Views: Record<never, never>; Functions: {\nget_catalog: { Args: Record<never, never>; Returns: Json };\nget_my_state: { Args: Record<never, never>; Returns: Json };\nrecord_cast: { Args: { jutsu_id: string; request_id: string }; Returns: Json };\nselect_companion: { Args: { ninja_id: string }; Returns: Json };\n}; Enums: Record<never, never>; CompositeTypes: Record<never, never> } }\n`,
    { parser: 'typescript', semi: false, singleQuote: true, printWidth: 100 },
  ),
)
await db.close()
console.log(
  'Generated naruto_spiritism types from all migrations; migration history was not modified.',
)
