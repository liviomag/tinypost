alter table if exists public.project_team_members
  add column if not exists regieansatz text,
  add column if not exists sollerloes text,
  add column if not exists regie_nummer text;
