alter table public.project_schedule_items
  add column if not exists color text not null default '#D6E2E9';

alter table public.project_schedule_items
  drop constraint if exists project_schedule_items_color_hex;

alter table public.project_schedule_items
  add constraint project_schedule_items_color_hex
  check (color ~ '^#[0-9A-Fa-f]{6}$');
