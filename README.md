# CHARIS VDMS — POC

Volunteer & Donor Management System for CHARIS Singapore.

## Demo login

| | |
|---|---|
| **Email** | `developer@charis-singapore.org` |
| **Password** | `CharisDemo2026!` |

Sign in at `/login` after running the seed script in Supabase.

## Quick start (local)

```bash
npm install
npm run dev
```

## Environment

**Local** (`.env`):

```
VITE_SUPABASE_URL=https://dtrsrvethuzszhbwltbn.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Vercel** — add the same two variables in Project Settings → Environment Variables.

## Database setup

```bash
SUPABASE_DB_PASSWORD='...' supabase db push    # migrations 001–002
```

Then run `supabase/seed.sql` in the Supabase **SQL Editor**.

If you already registered manually, just run:

```sql
UPDATE users SET role = 'super_admin'
WHERE email = 'developer@charis-singapore.org';
```

## Deploy (Vercel)

Push to `main` — Vercel builds automatically. `vercel.json` handles SPA routing.

## Scope

Prompts 1–7 implemented. Stripe/payments skipped for POC.
