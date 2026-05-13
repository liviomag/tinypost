create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kommissionsnummer text not null,
  projektname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects (owner_id);

alter table public.projects enable row level security;

create policy if not exists "projects_select_own"
on public.projects for select
using (auth.uid() = owner_id);

create policy if not exists "projects_insert_own"
on public.projects for insert
with check (auth.uid() = owner_id);

create policy if not exists "projects_update_own"
on public.projects for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy if not exists "projects_delete_own"
on public.projects for delete
using (auth.uid() = owner_id);
