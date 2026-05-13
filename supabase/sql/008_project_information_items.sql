create table if not exists public.project_information_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  text text not null,
  information_date date not null,
  gantt_item_id uuid references public.project_schedule_items(id) on delete set null,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists project_information_items_project_idx on public.project_information_items(project_id);
create index if not exists project_information_items_gantt_item_idx on public.project_information_items(gantt_item_id);

alter table public.project_information_items enable row level security;

drop policy if exists "project_information_items_select_own" on public.project_information_items;
create policy "project_information_items_select_own"
on public.project_information_items for select
using (
  exists (
    select 1 from public.projects p
    where p.id = project_information_items.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_information_items_insert_own" on public.project_information_items;
create policy "project_information_items_insert_own"
on public.project_information_items for insert
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_information_items.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_information_items_update_own" on public.project_information_items;
create policy "project_information_items_update_own"
on public.project_information_items for update
using (
  exists (
    select 1 from public.projects p
    where p.id = project_information_items.project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_information_items.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_information_items_delete_own" on public.project_information_items;
create policy "project_information_items_delete_own"
on public.project_information_items for delete
using (
  exists (
    select 1 from public.projects p
    where p.id = project_information_items.project_id
      and p.owner_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('project-information-documents', 'project-information-documents', false)
on conflict (id) do nothing;

drop policy if exists "project_information_storage_read" on storage.objects;
create policy "project_information_storage_read"
on storage.objects for select
using (
  bucket_id = 'project-information-documents'
  and exists (
    select 1
    from public.projects p
    where p.id::text = split_part(name, '/', 1)
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_information_storage_insert" on storage.objects;
create policy "project_information_storage_insert"
on storage.objects for insert
with check (
  bucket_id = 'project-information-documents'
  and exists (
    select 1
    from public.projects p
    where p.id::text = split_part(name, '/', 1)
      and p.owner_id = auth.uid()
  )
);
