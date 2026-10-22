-- SQL Editor: run as an administrator in the target project.
-- Zero rows means these checks passed; this does not test live concurrency.
begin read only;

with expected_tables(name, guest_read, user_read) as (
  values ('seals', true, true), ('jutsus', true, true),
    ('jutsu_seals', true, true), ('ninjas', true, true),
    ('ninja_unlock_jutsus', true, true), ('profiles', false, true),
    ('user_jutsu_progress', false, true), ('cast_events', false, true),
    ('user_ninja_unlocks', false, true), ('schema_migrations', false, false)
), actual_tables as (
  select c.oid, c.relname::text as name, c.relrowsecurity as rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'naruto_spiritism' and c.relkind = 'r'
), table_checks as (
  select coalesce(e.name, a.name) as object_name,
    case when a.oid is null then 'missing table'
      when e.name is null then 'unexpected table'
      when not a.rls then 'RLS disabled'
      when has_table_privilege('anon', a.oid, 'SELECT') <> e.guest_read then 'guest read mismatch'
      when has_table_privilege('authenticated', a.oid, 'SELECT') <> e.user_read then 'user read mismatch'
      when has_table_privilege('anon', a.oid, 'INSERT,UPDATE,DELETE,TRUNCATE') then 'guest writes allowed'
      when has_table_privilege('authenticated', a.oid, 'INSERT,UPDATE,DELETE,TRUNCATE') then 'user writes allowed'
    end as failure
  from expected_tables e full join actual_tables a using (name)
), expected_functions(signature, guest_execute, user_execute) as (
  values ('get_catalog()', true, true), ('get_my_state()', false, true),
    ('record_cast(text,uuid)', false, true), ('select_companion(text)', false, true),
    ('ensure_player()', false, false), ('player_snapshot(uuid)', false, false)
), actual_functions as (
  select p.oid, p.proconfig,
    replace(p.proname || '(' || oidvectortypes(p.proargtypes) || ')', ', ', ',') as signature,
    exists(select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_execute
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'naruto_spiritism'
), function_checks as (
  select coalesce(e.signature, a.signature) as object_name,
    case when a.oid is null then 'missing function'
      when e.signature is null then 'unexpected function'
      when a.public_execute then 'PUBLIC execute allowed'
      when has_function_privilege('anon', a.oid, 'EXECUTE') <> e.guest_execute then 'guest execute mismatch'
      when has_function_privilege('authenticated', a.oid, 'EXECUTE') <> e.user_execute then 'user execute mismatch'
      when not exists(select 1 from unnest(a.proconfig) s where s like 'search_path=%') then 'search_path not fixed'
    end as failure
  from expected_functions e full join actual_functions a using (signature)
)
select 'table' as kind, object_name, failure from table_checks where failure is not null
union all
select 'function', object_name, failure from function_checks where failure is not null
order by kind, object_name;

rollback;
