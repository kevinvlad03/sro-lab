-- ====================================================================
-- SRO Lab — initial database setup
-- Paste this entire file into Supabase SQL Editor and click "Run".
-- Safe to re-run: tables use IF NOT EXISTS / on conflict where possible.
-- ====================================================================

-- --------------------------------------------------------------------
-- Tables
-- --------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  approved boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Idempotent: add `approved` to profiles tables created before the pivot.
alter table public.profiles
  add column if not exists approved boolean not null default false;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  file_path text,
  source_url text,
  color text,
  material text,
  infill int check (infill is null or (infill between 0 and 100)),
  quantity int not null default 1 check (quantity > 0),
  visibility text not null default 'team' check (visibility in ('team', 'private')),
  status text not null default 'queued'
    check (status in ('queued', 'printing', 'done', 'failed', 'cancelled', 'rejected')),
  priority int not null default 0,
  rejection_reason text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint job_has_source check (file_path is not null or source_url is not null)
);

create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_owner_idx on public.jobs(owner_id);
create index if not exists jobs_queue_order_idx on public.jobs(priority desc, created_at asc) where status = 'queued';

create table if not exists public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  photo_path text not null,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists job_photos_job_idx on public.job_photos(job_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, read);

-- --------------------------------------------------------------------
-- Helpers
-- --------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (approved = true or role = 'admin')
  );
$$;

-- --------------------------------------------------------------------
-- Triggers: profile creation, role guard
-- --------------------------------------------------------------------

-- Clean up old domain-restriction trigger from earlier setups (idempotent)
drop trigger if exists enforce_email_domain_trigger on auth.users;
drop function if exists public.enforce_email_domain();

-- Auto-create a profile row whenever a new auth user is inserted.
-- The very first signup is bootstrapped as the admin (auto-approved);
-- everyone after that lands in `approved = false` until an admin flips it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles where role = 'admin')
    into is_first;

  insert into public.profiles (id, email, name, role, approved)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    case when is_first then 'admin' else 'user' end,
    case when is_first then true else false end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Block role escalation unless the caller is already an admin
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change role';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_trigger on public.profiles;
create trigger guard_profile_role_trigger
  before update on public.profiles
  for each row execute procedure public.guard_profile_role();

-- --------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_photos enable row level security;
alter table public.notifications enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- jobs ----------------------------------------------------------------
drop policy if exists "jobs_read_visible" on public.jobs;
create policy "jobs_read_visible"
  on public.jobs for select
  to authenticated
  using (visibility = 'team' or owner_id = auth.uid() or public.is_admin());

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own"
  on public.jobs for insert
  to authenticated
  with check (owner_id = auth.uid() and public.is_approved());

drop policy if exists "jobs_update_own_queued" on public.jobs;
create policy "jobs_update_own_queued"
  on public.jobs for update
  to authenticated
  using (owner_id = auth.uid() and status = 'queued')
  with check (owner_id = auth.uid());

drop policy if exists "jobs_delete_own_queued" on public.jobs;
create policy "jobs_delete_own_queued"
  on public.jobs for delete
  to authenticated
  using (owner_id = auth.uid() and status = 'queued');

drop policy if exists "jobs_admin_all" on public.jobs;
create policy "jobs_admin_all"
  on public.jobs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- job_photos ----------------------------------------------------------
drop policy if exists "photos_read_for_visible_jobs" on public.job_photos;
create policy "photos_read_for_visible_jobs"
  on public.job_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_photos.job_id
        and (j.visibility = 'team' or j.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "photos_admin_all" on public.job_photos;
create policy "photos_admin_all"
  on public.job_photos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- notifications -------------------------------------------------------
drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert"
  on public.notifications for insert
  to authenticated
  with check (public.is_admin());

-- --------------------------------------------------------------------
-- Storage buckets
-- --------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'prints', 'prints', false, 104857600,
    array[
      'application/sla',
      'application/vnd.ms-pki.stl',
      'model/stl',
      'model/3mf',
      'application/vnd.ms-3mfdocument',
      'application/octet-stream'
    ]
  ),
  (
    'photos', 'photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: prints (user uploads to their own folder, owner + admin can read)
drop policy if exists "prints_upload_own_folder" on storage.objects;
create policy "prints_upload_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'prints'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "prints_read_own_or_admin" on storage.objects;
create policy "prints_read_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'prints'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "prints_delete_own_or_admin" on storage.objects;
create policy "prints_delete_own_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'prints'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Storage RLS: photos (admin uploads, everyone authenticated reads)
drop policy if exists "photos_read_all_authed" on storage.objects;
create policy "photos_read_all_authed"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos');

drop policy if exists "photos_admin_write" on storage.objects;
create policy "photos_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos' and public.is_admin());

drop policy if exists "photos_admin_manage" on storage.objects;
create policy "photos_admin_manage"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos' and public.is_admin())
  with check (bucket_id = 'photos' and public.is_admin());

drop policy if exists "photos_admin_delete" on storage.objects;
create policy "photos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos' and public.is_admin());
