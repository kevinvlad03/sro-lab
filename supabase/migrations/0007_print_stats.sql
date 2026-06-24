-- ====================================================================
-- SRO Lab — per-job stats + weekly filament usage
-- ====================================================================
--
-- 1. jobs.print_minutes / jobs.filament_grams — admin fills these in on
--    Mark done so we know how long each print took and how much
--    filament it ate.
-- 2. weekly_usage — pre-aggregated table, one row per (user, week)
--    with running totals. Maintained by a trigger on jobs so we never
--    have to recompute on read.
--
-- Idempotent: safe to re-run.

-- --------------------------------------------------------------------
-- New job columns
-- --------------------------------------------------------------------

alter table public.jobs
  add column if not exists print_minutes int
    check (print_minutes is null or print_minutes >= 0);

alter table public.jobs
  add column if not exists filament_grams int
    check (filament_grams is null or filament_grams >= 0);

-- --------------------------------------------------------------------
-- Weekly usage aggregation table
-- --------------------------------------------------------------------

create table if not exists public.weekly_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  total_grams int not null default 0,
  total_minutes int not null default 0,
  job_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists weekly_usage_user_idx
  on public.weekly_usage(user_id, week_start desc);

-- --------------------------------------------------------------------
-- RLS for weekly_usage
-- --------------------------------------------------------------------

alter table public.weekly_usage enable row level security;

drop policy if exists "weekly_usage_read_own" on public.weekly_usage;
create policy "weekly_usage_read_own"
  on public.weekly_usage for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "weekly_usage_admin_all" on public.weekly_usage;
create policy "weekly_usage_admin_all"
  on public.weekly_usage for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------------------
-- Maintain weekly_usage when a job's status / stats change
-- --------------------------------------------------------------------

create or replace function public.update_weekly_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  week_start date;
  delta_grams int;
  delta_minutes int;
  delta_count int := 0;
begin
  -- We only care when the new state is "done with a completed_at."
  -- Un-doning a job (rare) is intentionally not undone in the totals.
  if new.status != 'done' or new.completed_at is null then
    return new;
  end if;

  week_start := date_trunc('week', new.completed_at)::date;

  if old.status = 'done' then
    -- Existing done job whose stats are being edited. Apply deltas.
    delta_grams := coalesce(new.filament_grams, 0) - coalesce(old.filament_grams, 0);
    delta_minutes := coalesce(new.print_minutes, 0) - coalesce(old.print_minutes, 0);
    if delta_grams = 0 and delta_minutes = 0 then
      return new;
    end if;
  else
    -- New transition to done.
    delta_grams := coalesce(new.filament_grams, 0);
    delta_minutes := coalesce(new.print_minutes, 0);
    delta_count := 1;
  end if;

  insert into public.weekly_usage (
    user_id, week_start, total_grams, total_minutes, job_count
  )
  values (new.owner_id, week_start, delta_grams, delta_minutes, delta_count)
  on conflict (user_id, week_start) do update
    set
      total_grams = weekly_usage.total_grams + excluded.total_grams,
      total_minutes = weekly_usage.total_minutes + excluded.total_minutes,
      job_count = weekly_usage.job_count + excluded.job_count,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_job_update_weekly_usage on public.jobs;
create trigger on_job_update_weekly_usage
  after update of status, filament_grams, print_minutes on public.jobs
  for each row execute procedure public.update_weekly_usage();
