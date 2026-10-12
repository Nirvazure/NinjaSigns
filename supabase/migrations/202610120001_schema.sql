-- Application-owned objects only. No changes to the shared auth schema or roles.
create schema if not exists naruto_spiritism;
grant usage on schema naruto_spiritism to anon, authenticated;

create table naruto_spiritism.seals (
  id text primary key check (id in ('rat','ox','tiger','hare','dragon','snake','horse','ram','monkey','bird','dog','boar')),
  name text not null, animal text not null, reading text not null,
  image text not null, hint text not null, sort_order integer not null unique
);
create table naruto_spiritism.jutsus (
  id text primary key, name text not null, short_name text not null,
  category text not null, description text not null,
  attack_power integer not null check (attack_power between 0 and 100),
  color text not null, duration integer not null check (duration >= 0), cover text not null,
  effect text check (effect in ('summoning','fireball','chidori')),
  sort_order integer not null unique
);
create table naruto_spiritism.jutsu_seals (
  jutsu_id text not null references naruto_spiritism.jutsus(id) on delete cascade,
  position integer not null check (position >= 0),
  seal_id text not null references naruto_spiritism.seals(id),
  primary key (jutsu_id, position)
);
create table naruto_spiritism.ninjas (
  id text primary key, name text not null, image text not null,
  unlock_kind text not null check (unlock_kind in ('starter','first-cast','jutsu-set','mastered-count')),
  required_count integer,
  sort_order integer not null unique,
  check ((unlock_kind = 'mastered-count' and required_count is not null and required_count > 0) or (unlock_kind <> 'mastered-count' and required_count is null))
);
create table naruto_spiritism.ninja_unlock_jutsus (
  ninja_id text not null references naruto_spiritism.ninjas(id) on delete cascade,
  position integer not null check (position >= 0),
  jutsu_id text not null references naruto_spiritism.jutsus(id),
  primary key (ninja_id, jutsu_id), unique (ninja_id, position)
);
create table naruto_spiritism.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  companion_id text not null default 'ninja-01' references naruto_spiritism.ninjas(id),
  state_version bigint not null default 0 check (state_version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table naruto_spiritism.user_jutsu_progress (
  user_id uuid not null references naruto_spiritism.profiles(id) on delete cascade,
  jutsu_id text not null references naruto_spiritism.jutsus(id),
  casts bigint not null check (casts between 1 and 9007199254740991),
  last_cast_at timestamptz not null,
  primary key (user_id, jutsu_id)
);
create table naruto_spiritism.user_ninja_unlocks (
  user_id uuid not null references naruto_spiritism.profiles(id) on delete cascade,
  ninja_id text not null references naruto_spiritism.ninjas(id),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, ninja_id)
);
create table naruto_spiritism.cast_events (
  user_id uuid not null references naruto_spiritism.profiles(id) on delete cascade,
  request_id uuid not null,
  jutsu_id text not null references naruto_spiritism.jutsus(id),
  newly_unlocked jsonb not null default '[]',
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);

-- Explicit grants AND RLS: private writes are available only through the RPCs.
do $$
declare t text;
begin
  foreach t in array array['seals','jutsus','jutsu_seals','ninjas','ninja_unlock_jutsus'] loop
    execute format('alter table naruto_spiritism.%I enable row level security', t);
    execute format('revoke all on naruto_spiritism.%I from public, anon, authenticated', t);
    execute format('grant select on naruto_spiritism.%I to anon, authenticated', t);
    execute format('create policy catalog_read on naruto_spiritism.%I for select to anon, authenticated using (true)', t);
  end loop;
  foreach t in array array['profiles','user_jutsu_progress','user_ninja_unlocks','cast_events'] loop
    execute format('alter table naruto_spiritism.%I enable row level security', t);
    execute format('revoke all on naruto_spiritism.%I from public, anon, authenticated', t);
    execute format('grant select on naruto_spiritism.%I to authenticated', t);
    execute format('create policy player_read on naruto_spiritism.%I for select to authenticated using ((select auth.uid()) = %I)', t, case when t = 'profiles' then 'id' else 'user_id' end);
  end loop;
end $$;

create function naruto_spiritism.get_catalog() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'seals', (select coalesce(jsonb_agg(to_jsonb(s) - 'sort_order' order by sort_order), '[]') from naruto_spiritism.seals s),
    'jutsus', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', j.id, 'name', j.name, 'shortName', j.short_name, 'category', j.category,
      'description', j.description, 'attackPower', j.attack_power, 'color', j.color,
      'duration', j.duration, 'cover', j.cover, 'effect', j.effect,
      'sequence', (select coalesce(jsonb_agg(s.seal_id order by s.position), '[]') from naruto_spiritism.jutsu_seals s where s.jutsu_id = j.id)
    ) order by j.sort_order), '[]') from naruto_spiritism.jutsus j),
    'ninjas', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', n.id, 'name', n.name, 'image', n.image,
      'unlock', case n.unlock_kind
        when 'starter' then jsonb_build_object('kind', 'starter')
        when 'mastered-count' then jsonb_build_object('kind', 'mastered-count', 'required', n.required_count)
        when 'first-cast' then jsonb_build_object('kind', 'first-cast', 'jutsuId', (select j.jutsu_id from naruto_spiritism.ninja_unlock_jutsus j where j.ninja_id=n.id order by j.position limit 1))
        else jsonb_build_object('kind', 'jutsu-set', 'jutsuIds', (select coalesce(jsonb_agg(j.jutsu_id order by j.position), '[]') from naruto_spiritism.ninja_unlock_jutsus j where j.ninja_id=n.id)) end
    ) order by n.sort_order), '[]') from naruto_spiritism.ninjas n)
  );
$$;

-- Internal helpers cannot be called through Data API, even by authenticated users.
create function naruto_spiritism.player_snapshot(player_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'userId', p.id, 'version', p.state_version, 'displayName', p.display_name,
    'avatarUrl', p.avatar_url, 'companionId', p.companion_id,
    'mastery', (select coalesce(jsonb_object_agg(j.jutsu_id, jsonb_build_object('casts', j.casts, 'lastCastAt', j.last_cast_at)), '{}') from naruto_spiritism.user_jutsu_progress j where j.user_id=p.id),
    'unlockedIds', (select coalesce(jsonb_agg(u.ninja_id order by n.sort_order), '[]') from naruto_spiritism.user_ninja_unlocks u join naruto_spiritism.ninjas n on n.id=u.ninja_id where u.user_id=p.id)
  ) from naruto_spiritism.profiles p where p.id=player_id;
$$;

create function naruto_spiritism.ensure_player() returns uuid
language plpgsql security definer set search_path = '' as $$
declare player_id uuid := auth.uid();
begin
  if player_id is null then raise exception '请先登录' using errcode='28000'; end if;
  insert into naruto_spiritism.profiles(id, display_name, avatar_url)
    select u.id, coalesce(nullif(u.raw_user_meta_data->>'full_name',''), nullif(u.raw_user_meta_data->>'name',''), nullif(u.raw_user_meta_data->>'user_name',''), split_part(u.email,'@',1), '忍者'),
      u.raw_user_meta_data->>'avatar_url' from auth.users u where u.id=player_id
    on conflict (id) do nothing;
  if not exists (select 1 from naruto_spiritism.profiles where id=player_id) then raise exception '账号不存在' using errcode='28000'; end if;
  -- This lock serializes casts/selection for the player, including first initialization.
  perform 1 from naruto_spiritism.profiles where id=player_id for update;
  insert into naruto_spiritism.user_ninja_unlocks(user_id, ninja_id)
    select player_id, n.id from naruto_spiritism.ninjas n where n.unlock_kind='starter'
    on conflict do nothing;
  return player_id;
end;
$$;

create function naruto_spiritism.get_my_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare player_id uuid;
begin
  player_id := naruto_spiritism.ensure_player();
  return naruto_spiritism.player_snapshot(player_id);
end;
$$;

create function naruto_spiritism.record_cast(jutsu_id text, request_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  player_id uuid;
  prior naruto_spiritism.cast_events%rowtype;
  rewards jsonb;
begin
  if request_id is null then raise exception 'request_id 不能为空' using errcode='22023'; end if;
  player_id := naruto_spiritism.ensure_player();
  select * into prior from naruto_spiritism.cast_events e where e.user_id=player_id and e.request_id=record_cast.request_id;
  if found then
    if prior.jutsu_id <> record_cast.jutsu_id then raise exception 'request_id 已用于另一忍术' using errcode='22023'; end if;
    return jsonb_build_object('state', naruto_spiritism.player_snapshot(player_id), 'newlyUnlocked', prior.newly_unlocked);
  end if;
  if jutsu_id is null or not exists (select 1 from naruto_spiritism.jutsus j where j.id=record_cast.jutsu_id) then raise exception '忍术不存在' using errcode='22023'; end if;
  insert into naruto_spiritism.user_jutsu_progress as p (user_id, jutsu_id, casts, last_cast_at)
    values (player_id, record_cast.jutsu_id, 1, clock_timestamp())
    on conflict on constraint user_jutsu_progress_pkey do update set casts=p.casts+1, last_cast_at=excluded.last_cast_at;
  with eligible as (
    select n.id from naruto_spiritism.ninjas n where
      n.unlock_kind='starter'
      or (n.unlock_kind='mastered-count' and (select count(*) from naruto_spiritism.user_jutsu_progress p where p.user_id=player_id) >= n.required_count)
      or (n.unlock_kind in ('first-cast','jutsu-set')
        and exists (select 1 from naruto_spiritism.ninja_unlock_jutsus r where r.ninja_id=n.id)
        and not exists (select 1 from naruto_spiritism.ninja_unlock_jutsus r where r.ninja_id=n.id and not exists (select 1 from naruto_spiritism.user_jutsu_progress p where p.user_id=player_id and p.jutsu_id=r.jutsu_id)))
  ), added as (
    insert into naruto_spiritism.user_ninja_unlocks(user_id, ninja_id)
      select player_id, id from eligible on conflict do nothing returning ninja_id
  ) select coalesce(jsonb_agg(a.ninja_id order by n.sort_order), '[]') into rewards
    from added a join naruto_spiritism.ninjas n on n.id=a.ninja_id;
  insert into naruto_spiritism.cast_events(user_id, request_id, jutsu_id, newly_unlocked)
    values (player_id, record_cast.request_id, record_cast.jutsu_id, rewards);
  update naruto_spiritism.profiles set state_version=state_version+1, updated_at=clock_timestamp() where id=player_id;
  return jsonb_build_object('state', naruto_spiritism.player_snapshot(player_id), 'newlyUnlocked', rewards);
end;
$$;

create function naruto_spiritism.select_companion(ninja_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare player_id uuid;
begin
  player_id := naruto_spiritism.ensure_player();
  if ninja_id is null or not exists (select 1 from naruto_spiritism.user_ninja_unlocks u where u.user_id=player_id and u.ninja_id=select_companion.ninja_id) then
    raise exception '忍者未解锁' using errcode='22023';
  end if;
  update naruto_spiritism.profiles set companion_id=select_companion.ninja_id, state_version=state_version+1, updated_at=clock_timestamp() where id=player_id;
  return naruto_spiritism.player_snapshot(player_id);
end;
$$;

revoke all on all functions in schema naruto_spiritism from public, anon, authenticated;
grant execute on function naruto_spiritism.get_catalog() to anon, authenticated;
grant execute on function naruto_spiritism.get_my_state(), naruto_spiritism.record_cast(text, uuid), naruto_spiritism.select_companion(text) to authenticated;
