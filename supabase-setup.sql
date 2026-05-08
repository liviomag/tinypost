-- Supabase Database Setup for TinyPost Auth App
-- Execute this script in Supabase SQL Editor.

-- 1) Optional extension used for UUID generation in custom tables.
create extension if not exists "pgcrypto";

-- 2) Profile table linked 1:1 to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for authenticated users';

-- 3) Keep updated_at current
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
before update on public.profiles
for each row
execute function public.handle_updated_at();

-- 4) Create a profile row automatically when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 5) Row Level Security
alter table public.profiles enable row level security;


-- Drop policies first so script can be re-run safely
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

-- Allow authenticated users to read all profiles
create policy "Profiles are viewable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

-- Allow users to insert only their own profile row
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Allow users to update only their own profile row
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Optional: allow users to delete own profile
create policy "Users can delete own profile"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

-- 6) Helpful index
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- 7) Orders and Gantt entries
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gantt_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position_id uuid,
  entry_code text,
  calendar_week integer,
  calendar_year integer,
  title text,
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gantt_date_check check (end_date >= start_date)
);

drop trigger if exists on_orders_updated on public.orders;
create trigger on_orders_updated
before update on public.orders
for each row
execute function public.handle_updated_at();

drop trigger if exists on_gantt_entries_updated on public.gantt_entries;
create trigger on_gantt_entries_updated
before update on public.gantt_entries
for each row
execute function public.handle_updated_at();

alter table public.orders enable row level security;
alter table public.gantt_entries enable row level security;

drop policy if exists "Users can manage own orders" on public.orders;
create policy "Users can manage own orders"
on public.orders
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own gantt entries" on public.gantt_entries;
create policy "Users can manage own gantt entries"
on public.gantt_entries
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists orders_user_id_created_idx on public.orders (user_id, created_at desc);
create index if not exists gantt_entries_order_id_start_idx on public.gantt_entries (order_id, start_date);

-- 8) Position tracking tables for repeatable/movable timeline entries
create table if not exists public.gantt_positions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gantt_position_events (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.gantt_positions(id) on delete cascade,
  gantt_entry_id uuid not null references public.gantt_entries(id) on delete cascade,
  event_type text not null default 'created',
  event_note text,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'gantt_entries'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'gantt_entries' and column_name = 'position_id'
    ) then
      alter table public.gantt_entries add column position_id uuid;
    end if;

    if not exists (
      select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'gantt_entries'
        and c.conname = 'gantt_entries_position_fk'
    ) then
      alter table public.gantt_entries
        add constraint gantt_entries_position_fk
        foreign key (position_id) references public.gantt_positions(id) on delete set null;
    end if;
  end if;
end $$;

drop trigger if exists on_gantt_positions_updated on public.gantt_positions;
create trigger on_gantt_positions_updated
before update on public.gantt_positions
for each row
execute function public.handle_updated_at();

alter table public.gantt_positions enable row level security;
alter table public.gantt_position_events enable row level security;

drop policy if exists "Users can manage own gantt positions" on public.gantt_positions;
create policy "Users can manage own gantt positions"
on public.gantt_positions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own gantt position events" on public.gantt_position_events;
create policy "Users can manage own gantt position events"
on public.gantt_position_events
for all
to authenticated
using (
  exists (
    select 1 from public.gantt_positions p
    where p.id = gantt_position_events.position_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.gantt_positions p
    where p.id = gantt_position_events.position_id
      and p.user_id = auth.uid()
  )
);

create index if not exists gantt_positions_order_idx on public.gantt_positions (order_id, created_at desc);
create index if not exists gantt_events_position_idx on public.gantt_position_events (position_id, created_at desc);
