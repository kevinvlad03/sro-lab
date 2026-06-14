-- ====================================================================
-- SRO Lab — job details: settings mode + link thumbnail
-- Idempotent: safe to re-run.
-- Paste into Supabase SQL Editor and click "Run".
-- ====================================================================

alter table public.jobs
  add column if not exists settings_mode text not null default 'creator'
    check (settings_mode in ('creator', 'custom'));

alter table public.jobs
  add column if not exists thumbnail_url text;
