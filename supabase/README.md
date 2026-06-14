# Supabase setup

## Apply the initial migration

1. Open your Supabase project → **SQL Editor** (left sidebar).
2. Click **+ New query**.
3. Open `migrations/0001_initial_setup.sql` in this folder, copy the whole file, paste it into the editor.
4. Click **Run**.

You should see "Success. No rows returned." and no red errors. If anything fails, copy the error and send it over — I'll patch the migration.

## After the migration runs — promote yourself to admin

Sign up first via the app at `/login` (once the auth UI is wired). Then come back to the SQL Editor and run:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR-EMAIL@sms-group.com';
```

(Replace with your actual email.) Confirm with:

```sql
select email, role from public.profiles;
```

## What the migration creates

- **Tables**: `profiles`, `jobs`, `job_photos`, `notifications`
- **Triggers**:
  - Rejects any signup whose email is not `@sms-group.com`
  - Auto-creates a `profiles` row on signup
  - Prevents users from promoting themselves to admin
- **Row Level Security** policies for all tables (users see their own + team-visible jobs; admin sees everything)
- **Storage buckets**:
  - `prints` (100 MB, private, STL/3MF) — users upload to their own folder
  - `photos` (10 MB, private but readable by all signed-in users, JPEG/PNG/WebP) — only admin uploads

## If you need to wipe and start over

```sql
drop table if exists public.notifications, public.job_photos, public.jobs, public.profiles cascade;
drop function if exists public.is_admin, public.enforce_email_domain, public.handle_new_user, public.guard_profile_role cascade;
drop trigger if exists enforce_email_domain_trigger on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
delete from storage.buckets where id in ('prints', 'photos');
```

Then re-run the migration.
