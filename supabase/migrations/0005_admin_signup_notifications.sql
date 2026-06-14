-- ====================================================================
-- SRO Lab — notify admins when a new user signs up pending approval
-- ====================================================================
--
-- Fires once on profiles insert. The handle_new_user trigger creates
-- the row; this one piggybacks on the same insert and fans out one
-- notification per existing admin.
--
-- We skip the first-user case (that row is role='admin' from the
-- handle_new_user bootstrap) and already-approved inserts (which can
-- only happen if a row is seeded manually).
--
-- Idempotent: safe to re-run.

create or replace function public.notify_admins_on_new_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approved = true or new.role = 'admin' then
    return new;
  end if;

  insert into public.notifications (user_id, type, message)
  select
    p.id,
    'new_signup',
    new.name || ' just signed up and is waiting for approval.'
  from public.profiles p
  where p.role = 'admin';

  return new;
end;
$$;

drop trigger if exists on_new_pending_signup on public.profiles;
create trigger on_new_pending_signup
  after insert on public.profiles
  for each row execute procedure public.notify_admins_on_new_signup();
