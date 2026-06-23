# Deployment

Quick checklist for shipping SRO Lab to production. Most of these are one-time
setup; once they're in place, deploys are just `git push`.

## Hosting

The app is a standard Next.js 16 App Router project — works on Vercel,
Netlify, Cloudflare Pages, Railway, or self-hosted. Vercel is the path of
least friction.

```bash
# From the project root
git push origin main
# Then in Vercel: New Project → import kevinvlad03/sro-lab → Deploy
```

## Environment variables

Set these on the host (Vercel: Project → Settings → Environment Variables).
All four are required for the app to fully work in production:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From the same page → `anon public` |
| `NEXT_PUBLIC_SITE_URL` | The production URL, e.g. `https://sro-lab.vercel.app` (no trailing slash) |
| `RESEND_API_KEY` | From the Resend dashboard |
| `RESEND_FROM_EMAIL` | Optional. `SRO Lab <notifications@yourdomain.com>` once you verify a domain. Leave blank to use Resend's sandbox. |

Without `NEXT_PUBLIC_SITE_URL`, emails contain `http://localhost:3000`
links — that's the most common production gotcha.

## Supabase dashboard updates

When you switch from localhost to a public URL, two settings need to change.

### Auth → URL Configuration

- **Site URL**: change to your production URL (e.g.
  `https://sro-lab.vercel.app`).
- **Redirect URLs** (allowlist): add `https://sro-lab.vercel.app/**`
  so the OAuth callback isn't rejected.

Without these, Google sign-in will fail in production with
`redirect_to is not allowed`.

### Google OAuth Console

Already done when you first set up Google. The redirect URI in
console.cloud.google.com is the **Supabase** callback
(`https://<project>.supabase.co/auth/v1/callback`), not your app URL, so
nothing changes here when you deploy.

## Resend domain (only when you want colleagues to get email)

Until you verify a domain in Resend, emails only deliver to the email
tied to your Resend account. To open it up to the whole team:

1. Buy a domain ($10/yr from Porkbun, Cloudflare, Namecheap).
2. In Resend dashboard → Domains → add it → add the SPF/DKIM records
   they show you in your registrar's DNS settings.
3. Wait a few minutes for verification.
4. Set `RESEND_FROM_EMAIL=SRO Lab <notifications@yourdomain.com>` on
   Vercel and redeploy.

## File uploads work in production?

Yes. STL files upload directly from the browser to Supabase Storage, so
they bypass Vercel's 4.5 MB Server Action body cap. The 100 MB limit is
the bucket's, set in migration `0001`.

## Database migrations

If you haven't already, run these in order in Supabase SQL Editor:

1. `0001_initial_setup.sql`
2. `0002_job_details.sql`
3. `0003_photos_public.sql`
4. `0004_notification_triggers.sql`
5. `0005_admin_signup_notifications.sql`

All are idempotent — re-running is safe.

## First-time sign-in on production

The first user to sign up on a fresh database becomes admin
automatically. If that's not you (e.g. you signed up locally first and
the production DB is empty), claim admin via SQL:

```sql
update public.profiles
set role = 'admin', approved = true
where email = 'you@example.com';
```

## Smoke test after deploy

1. Visit the URL.
2. Sign in with Google.
3. Submit a print with a small STL.
4. Submit a print with a Printables link — confirm the thumbnail
   renders.
5. As admin: Start the job, Mark done with a photo. Verify the photo
   shows up on `/gallery`.
6. Click Download on a job with a file — confirm it downloads the file.
7. Check Resend → Logs for the status-change email.
