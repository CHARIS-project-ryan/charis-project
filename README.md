# CHARIS VDMS — POC

Volunteer & Donor Management System for CHARIS Singapore.

**Product documentation:** [docs/PRODUCT.md](docs/PRODUCT.md) — features, roles, data model, and roadmap (for stakeholders and future product specs).

## Demo logins

Password for all accounts: **`CharisDemo2026!`**

| Role | Email | Organisation |
|------|-------|----------------|
| CHARIS super admin | `developer@charis-singapore.org` | All orgs |
| Org admin | `sarah.chua@gebirah.sg` | Gebirah |
| Org admin | `john.lim@jrs.net.sg` | JRS Singapore |
| Org admin | `maria.fernandez@focolare.org` | Focolare |

Sign in at `/login` after running the seed script in Supabase. Use **Sign out** in the top bar or sidebar footer to switch accounts.

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

**Login error "Database error querying schema"?** Run `supabase/fix-auth-login.sql` in the SQL Editor — seeded auth users need empty token columns and `auth.identities` rows.

**Dashboard shows no donations?** Run `supabase/seed-donations-fix.sql` in the SQL Editor. Donation rows need donor users (from the auth section of `seed.sql`) plus organisations/campaigns. The fix script diagnoses counts, inserts 27 demo donations, and sets `super_admin` on the demo login.

**"infinite recursion" on donations/donors?** Run `supabase/fix-rls-recursion.sql` in the SQL Editor (or `supabase db push` for migration `003`).

**Donor names show as "—" for org admins?** Run `supabase/fix-users-donor-names.sql` (or migration `005`) — org admins could read `donors` but RLS blocked the nested `users` join.

**Audit log User shows "—" for some rows?** Run `supabase/fix-users-audit-actors.sql` (or migration `007`) so org admins can read profiles of actors on their org’s audit trail (e.g. CHARIS staff).

**Campaigns/Opportunities show "—" for Organisation (Gebirah only named)?** Run `supabase/fix-campaigns-opportunities-rls.sql` (or migration `006`) — public read policies exposed all active rows to org admins without letting them read other org names.

**Volunteers not showing for org admins?** Run `supabase/seed-volunteer-memberships.sql` and migration `004` (`supabase db push`). Volunteers join orgs via `user_organisations` with `role_in_org = member` (explicit join); org admins only see members of their org(s).

If you already registered manually, just run:

```sql
UPDATE users SET role = 'super_admin'
WHERE email = 'developer@charis-singapore.org';
```

## Deploy (Vercel)

Push to `main` — Vercel builds automatically. `vercel.json` handles SPA routing.

## Scope

Prompts 1–7 implemented. Stripe/payments skipped for POC.
