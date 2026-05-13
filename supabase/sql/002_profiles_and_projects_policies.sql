create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

alter table public.profiles enable row level security;

-- Profiles policies (Postgres does not support CREATE POLICY IF NOT EXISTS)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete
using (auth.uid() = id);

-- Projects policies (only if projects table already exists)
do $$
begin
  if to_regclass('public.projects') is null then
    raise notice 'Skipping projects policies: relation public.projects does not exist yet.';
    return;
  end if;

  execute 'alter table public.projects enable row level security';

  execute 'drop policy if exists "projects_select_own" on public.projects';
  execute 'create policy "projects_select_own" on public.projects for select using (auth.uid() = owner_id)';

  execute 'drop policy if exists "projects_insert_own" on public.projects';
  execute 'create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = owner_id)';

  execute 'drop policy if exists "projects_update_own" on public.projects';
  execute 'create policy "projects_update_own" on public.projects for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id)';

  execute 'drop policy if exists "projects_delete_own" on public.projects';
  execute 'create policy "projects_delete_own" on public.projects for delete using (auth.uid() = owner_id)';
end
$$;
