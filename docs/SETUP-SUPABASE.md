# Supabase setup (Phase 0)

The student profile feature uses **Supabase** for auth + database + file storage.
Until the keys below are set, the auth layer no-ops and the rest of the app runs
normally (the login page shows a "not configured" banner).

## 1. Create a project
1. Go to https://supabase.com → New project (free tier is fine).
2. Project → **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)

## 2. Add keys
Create `.env.local` in the project root (git-ignored) with:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

## 3. Create the schema
Open Supabase → **SQL Editor**, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. This creates the tables, RLS
policies, the new-user trigger, and the `profile-media` storage bucket.

## 4. Seed demo accounts
```
node scripts/seed.mjs
```
Creates three logins (password `Password123!` for all):

| Role      | Email                      | Profile                     |
|-----------|----------------------------|-----------------------------|
| student   | kumar@demo.ingen.test      | Kumar Dhananjaya Shivanna   |
| student   | aisha@demo.ingen.test      | Aisha Khan                  |
| recruiter | recruiter@demo.ingen.test  | Riya Recruiter              |

Logging in as different users shows different profiles. Student → `/student`,
recruiter → `/` (home).

## 5. LinkedIn OAuth
1. Create a LinkedIn Developer app and add the **Sign In with LinkedIn using
   OpenID Connect** product.
2. Supabase -> **Authentication -> Providers -> LinkedIn (OIDC)**: enable the
   provider and enter the LinkedIn client ID and secret.
3. Add the Supabase provider callback URL shown in the dashboard to the LinkedIn
   app's authorized redirect URLs.
4. In Supabase Auth settings, enable manual identity linking so an existing
   email/password student can use `linkIdentity`.
5. Add the app callback URLs to Supabase's redirect allow list:
   - `http://localhost:5176/auth/callback`
   - `http://localhost:5178/auth/callback` when using the alternate local port
   - the production `/auth/callback` URL

The profile page's **Connect LinkedIn** button only imports identity fields:
name, email, and profile photo. Work history is intentionally not requested;
rich profile data continues to come from Aristotle, resumes, and proof links.

## 6. Disable email confirmation for faster local testing (optional)
Supabase → **Authentication → Sign In / Providers → Email** → turn off
"Confirm email" so signups log in immediately without an email round-trip.
