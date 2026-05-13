alter table public.project_schedule_items
add column if not exists resources boolean not null default false,
add column if not exists resource_assignments jsonb not null default '[]'::jsonb;

drop policy if exists "profiles_select_authenticated_directory" on public.profiles;
create policy "profiles_select_authenticated_directory"
on public.profiles for select
using (auth.uid() is not null);
