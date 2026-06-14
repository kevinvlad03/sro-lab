# Supabase setup

## 1. Apply the initial migration

1. Open your Supabase project → **SQL Editor** (left sidebar).
2. Click **+ New query**.
3. Open `migrations/0001_initial_setup.sql` in this folder, copy the whole file, paste it into the editor.
4. Click **Run**.

You should see "Success. No rows returned." and no red errors. If anything fails, copy the error and send it over — I'll patch the migration.

## 2. Enable OAuth providers (Google, Apple)

Open **Authentication → Providers** in Supabase.

### Google
1. Create an OAuth 2.0 client at https://console.cloud.google.com/apis/credentials.
2. Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback` (Supabase shows the exact URL on the Google provider page).
3. Paste the client ID + client secret into Supabase → Google → Enable.

### Apple (optional, needs a paid Apple Developer account)
Sign in with Apple needs a Services ID + signing key from developer.apple.com. Supabase has a step-by-step guide on the provider page. Skip it for now if you don't have an Apple Developer account — the button on the login page will show an error until you enable it, but Google + email/password will work fine on their own.

### Email
Email/password is on by default. Nothing to configure.

## 3. Sign yourself up — you become admin automatically

The first person to sign up (any method: Google, Apple, or email) is automatically promoted to `admin` and `approved`. So **sign up first** at `http://localhost:3000/login` to claim the admin seat.

Confirm with:

```sql
select email, role, approved from public.profiles;
```

You should see your row with `role = 'admin'` and `approved = true`.

## 4. Subsequent signups

Anyone else who signs up lands in `approved = false` and can't submit jobs until you approve them. For now (before the admin UI is built), approve via SQL:

```sql
update public.profiles set approved = true where email = 'their-email@example.com';
```

The admin approval panel (one-click approve/reject) will replace this in a later phase.

## What the migration creates

- **Tables**: `profiles` (with `approved` flag), `jobs`, `job_photos`, `notifications`
- **Triggers**:
  - Auto-creates a `profiles` row on signup, with the **first user bootstrapped as admin + approved**
  - Prevents users from promoting themselves to admin
- **Row Level Security** policies for all tables; new users can sign in but can't insert jobs until `approved = true`
- **Storage buckets**:
  - `prints` (100 MB, private, STL/3MF) — users upload to their own folder
  - `photos` (10 MB, private but readable by all signed-in users, JPEG/PNG/WebP) — only admin uploads

## If you need to wipe and start over

```sql
drop table if exists public.notifications, public.job_photos, public.jobs, public.profiles cascade;
drop function if exists public.is_admin, public.is_approved, public.handle_new_user, public.guard_profile_role cascade;
drop trigger if exists on_auth_user_created on auth.users;
delete from storage.buckets where id in ('prints', 'photos');
-- Also clear out any test users in Authentication → Users in the dashboard.
```

Then re-run `0001_initial_setup.sql`.
