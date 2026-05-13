create table if not exists public.project_schedule_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_schedule_items_date_order check (end_date >= start_date)
);

create index if not exists project_schedule_items_project_id_idx
  on public.project_schedule_items (project_id);

alter table public.project_schedule_items enable row level security;

drop policy if exists "schedule_items_select_project_owner" on public.project_schedule_items;
create policy "schedule_items_select_project_owner"
on public.project_schedule_items for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_schedule_items.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "schedule_items_insert_project_owner" on public.project_schedule_items;
create policy "schedule_items_insert_project_owner"
on public.project_schedule_items for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_schedule_items.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "schedule_items_update_project_owner" on public.project_schedule_items;
create policy "schedule_items_update_project_owner"
on public.project_schedule_items for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_schedule_items.project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_schedule_items.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "schedule_items_delete_project_owner" on public.project_schedule_items;
create policy "schedule_items_delete_project_owner"
on public.project_schedule_items for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_schedule_items.project_id
      and p.owner_id = auth.uid()
  )
);
