alter table public.project_schedule_items
  add column if not exists history jsonb not null default '[]'::jsonb;

create or replace function public.build_project_schedule_item_history_entry(
  p_title text,
  p_start_date date,
  p_end_date date,
  p_resources boolean,
  p_resource_assignments jsonb
)
returns jsonb
language sql
stable
as $$
  select jsonb_strip_nulls(
    jsonb_build_object(
      'changed_at', timezone('utc', now()),
      'title', p_title,
      'start_date', p_start_date,
      'end_date', p_end_date,
      'resources', case when p_resources then true else null end,
      'resource_count', case
        when p_resources and jsonb_typeof(coalesce(p_resource_assignments, '[]'::jsonb)) = 'array'
          then jsonb_array_length(coalesce(p_resource_assignments, '[]'::jsonb))
        when p_resources then 0
        else null
      end
    )
  );
$$;

create or replace function public.project_schedule_items_append_history()
returns trigger
language plpgsql
as $$
declare
  v_old_resource_count integer;
  v_new_resource_count integer;
  v_entry jsonb;
begin
  if tg_op = 'INSERT' then
    v_entry := public.build_project_schedule_item_history_entry(
      new.title,
      new.start_date,
      new.end_date,
      new.resources,
      new.resource_assignments
    );

    new.history := coalesce(new.history, '[]'::jsonb) || jsonb_build_array(v_entry);
    new.updated_at := now();
    return new;
  end if;

  v_old_resource_count := case
    when old.resources and jsonb_typeof(coalesce(old.resource_assignments, '[]'::jsonb)) = 'array'
      then jsonb_array_length(coalesce(old.resource_assignments, '[]'::jsonb))
    when old.resources then 0
    else null
  end;

  v_new_resource_count := case
    when new.resources and jsonb_typeof(coalesce(new.resource_assignments, '[]'::jsonb)) = 'array'
      then jsonb_array_length(coalesce(new.resource_assignments, '[]'::jsonb))
    when new.resources then 0
    else null
  end;

  if new.title is distinct from old.title
     or new.start_date is distinct from old.start_date
     or new.end_date is distinct from old.end_date
     or new.resources is distinct from old.resources
     or v_new_resource_count is distinct from v_old_resource_count then
    v_entry := public.build_project_schedule_item_history_entry(
      new.title,
      new.start_date,
      new.end_date,
      new.resources,
      new.resource_assignments
    );

    new.history := coalesce(old.history, '[]'::jsonb) || jsonb_build_array(v_entry);
  else
    new.history := old.history;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists project_schedule_items_append_history_trigger on public.project_schedule_items;
create trigger project_schedule_items_append_history_trigger
before insert or update on public.project_schedule_items
for each row execute function public.project_schedule_items_append_history();
