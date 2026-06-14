-- ====================================================================
-- SRO Lab — notification triggers
-- ====================================================================
--
-- Inserts into public.notifications happen automatically when:
--   (a) a job's status column changes — notify the owner
--   (b) a profile's approved flag flips from false to true — notify
--       the user
--
-- Functions are SECURITY DEFINER so they bypass RLS when inserting on
-- behalf of the system.
--
-- Idempotent: drops + recreates triggers and functions.

-- --------------------------------------------------------------------
-- Job status changes
-- --------------------------------------------------------------------

create or replace function public.notify_job_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg text;
  msg_type text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  case new.status
    when 'printing' then
      msg_type := 'job_printing';
      msg := 'Your print "' || new.title || '" is now printing.';
    when 'done' then
      msg_type := 'job_done';
      msg := 'Your print "' || new.title || '" is done.';
    when 'failed' then
      msg_type := 'job_failed';
      msg := 'Your print "' || new.title || '" failed.';
    when 'cancelled' then
      msg_type := 'job_cancelled';
      msg := 'Your print "' || new.title || '" was cancelled.';
    when 'rejected' then
      msg_type := 'job_rejected';
      msg := 'Your print "' || new.title || '" was rejected: '
        || coalesce(nullif(new.rejection_reason, ''), 'No reason given.');
    else
      return new;
  end case;

  insert into public.notifications (user_id, job_id, type, message)
  values (new.owner_id, new.id, msg_type, msg);

  return new;
end;
$$;

drop trigger if exists on_job_status_change on public.jobs;
create trigger on_job_status_change
  after update of status on public.jobs
  for each row execute procedure public.notify_job_status_change();

-- --------------------------------------------------------------------
-- Account approval
-- --------------------------------------------------------------------

create or replace function public.notify_user_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.approved is distinct from new.approved and new.approved = true then
    insert into public.notifications (user_id, type, message)
    values (
      new.id,
      'account_approved',
      'Your account was approved. You can now submit prints.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_user_approved on public.profiles;
create trigger on_user_approved
  after update of approved on public.profiles
  for each row execute procedure public.notify_user_approved();
