create table if not exists public.project_team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('Lehrling', 'Monteur')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.project_team_members enable row level security;

drop policy if exists "project_team_members_select_own" on public.project_team_members;
create policy "project_team_members_select_own"
on public.project_team_members
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner = auth.uid()
  )
);

drop policy if exists "project_team_members_insert_own" on public.project_team_members;
create policy "project_team_members_insert_own"
on public.project_team_members
for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner = auth.uid()
  )
);
