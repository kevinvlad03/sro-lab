-- ====================================================================
-- SRO Lab — fix ambiguous column reference in update_weekly_usage
-- ====================================================================
--
-- The trigger function declared a local variable named `week_start`
-- and the weekly_usage table has a column of the same name. Postgres
-- couldn't tell which one was meant in the ON CONFLICT (user_id,
-- week_start) clause and raised:
--   ERROR  42702  column reference "week_start" is ambiguous
--
-- That bubbled up as "Could not mark done: ..." on the client every
-- time an admin tried to mark a print done.
--
-- Fix: rename the variable to `wk_start` so there's no collision.
-- CREATE OR REPLACE FUNCTION replaces the broken definition in place.

create or replace function public.update_weekly_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wk_start date;
  delta_grams int;
  delta_minutes int;
  delta_count int := 0;
begin
  if new.status != 'done' or new.completed_at is null then
    return new;
  end if;

  wk_start := date_trunc('week', new.completed_at)::date;

  if old.status = 'done' then
    delta_grams := coalesce(new.filament_grams, 0) - coalesce(old.filament_grams, 0);
    delta_minutes := coalesce(new.print_minutes, 0) - coalesce(old.print_minutes, 0);
    if delta_grams = 0 and delta_minutes = 0 then
      return new;
    end if;
  else
    delta_grams := coalesce(new.filament_grams, 0);
    delta_minutes := coalesce(new.print_minutes, 0);
    delta_count := 1;
  end if;

  insert into public.weekly_usage (
    user_id, week_start, total_grams, total_minutes, job_count
  )
  values (new.owner_id, wk_start, delta_grams, delta_minutes, delta_count)
  on conflict (user_id, week_start) do update
    set
      total_grams = weekly_usage.total_grams + excluded.total_grams,
      total_minutes = weekly_usage.total_minutes + excluded.total_minutes,
      job_count = weekly_usage.job_count + excluded.job_count,
      updated_at = now();

  return new;
end;
$$;
