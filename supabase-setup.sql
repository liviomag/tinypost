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
