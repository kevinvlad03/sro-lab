-- ====================================================================
-- SRO Lab — broadcast notifications via Supabase Realtime
-- ====================================================================
--
-- Adds public.notifications to the supabase_realtime publication so
-- the app can subscribe via supabase.channel(...).on(...) and get
-- INSERT events pushed to the open page. RLS still applies — users
-- only ever see rows where user_id = auth.uid().
--
-- Idempotent: safe to re-run.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
