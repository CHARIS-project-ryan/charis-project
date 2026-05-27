# CHARIS VDMS — Cursor Implementation Prompt

## Stack
- React 18 + Vite + TypeScript
- Supabase (Postgres + Auth + RLS + Storage + Edge Functions)
- TanStack Query v5 + TanStack Router
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Stripe.js
- GitHub (source control)
- Vercel (hosting + CI/CD)

---

## What to build

A multi-tenant Volunteer and Donor Management System for CHARIS Singapore. Multiple member organisations (MOs) share one database but see only their own data, enforced by Supabase Row-Level Security. CHARIS super-admins see everything.

---

## Prompt 1 — Scaffold the project

```
Scaffold a React + Vite TypeScript project called charis-vdms.

Install: @supabase/supabase-js, @tanstack/react-query, @tanstack/react-router, react-hook-form, @hookform/resolvers, zod, @stripe/stripe-js, @stripe/react-stripe-js, recharts, lucide-react, date-fns, zustand.

Set up Tailwind CSS and initialise shadcn/ui.

Create .env with: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY.

Create src/lib/supabase.ts exporting a single Supabase client using those env vars.

Set up TanStack Router with these routes:
- /login and /register (public)
- /dashboard (protected layout with sidebar)
  - /dashboard/ — role-aware home
  - /dashboard/organisations
  - /dashboard/campaigns and /dashboard/campaigns/$id
  - /dashboard/opportunities and /dashboard/opportunities/$id
  - /dashboard/volunteers and /dashboard/volunteers/$id
  - /dashboard/donors and /dashboard/donors/$id
  - /dashboard/donations
  - /dashboard/audit-logs

Create a ProtectedRoute component that reads the Supabase session and redirects to /login if missing.

Wrap the app in QueryClientProvider and RouterProvider in main.tsx.
```

---

## Prompt 2 — Database schema

```
Create supabase/migrations/001_schema.sql with the full database schema.

Enums: user_role (super_admin, org_admin, volunteer, donor), org_role (admin, staff, member), gender, tshirt_size, payment_method (paynow, credit_card, bank_transfer, cheque, cash), payment_status (pending, completed, failed, refunded), recurring_frequency, tax_receipt_preference, audit_action (create, update, delete, login, logout, export), assignment_status (pending, confirmed, completed, cancelled, no_show).

Tables:
- organisations: id (uuid pk), name, slug (unique), description, logo_url, contact_email, contact_phone, website_url, is_active, created_at, updated_at, created_by, updated_by
- users: id (uuid pk, references auth.users), email (unique), first_name, last_name, phone_number, profile_image_url, role (user_role), is_active, last_login_at, pdpa_consent_given, pdpa_consent_date, created_at, updated_at
- user_organisations: id, user_id → users, organisation_id → organisations, role_in_org (org_role), joined_at, is_active — UNIQUE(user_id, organisation_id)
- volunteers: id, user_id (unique) → users, date_of_birth, gender, address_line1, address_line2, postal_code, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, skills (text[]), availability (jsonb), dietary_restrictions, medical_conditions, t_shirt_size, preferred_language, volunteer_since, total_hours_served (decimal default 0), is_active
- donors: id, user_id (unique) → users, donor_since, total_donated (decimal default 0), donation_count (int default 0), preferred_payment_method, tax_receipt_preference, mailing_address_line1, mailing_address_line2, mailing_postal_code, is_recurring_donor, communication_preferences (jsonb), is_anonymous, is_active
- campaigns: id, organisation_id → organisations, title, slug, description, short_description, goal_amount (check > 0), current_amount (default 0), currency (default SGD), start_date, end_date, image_url, is_featured, is_active, category — UNIQUE(organisation_id, slug)
- donations: id, donor_id → donors, campaign_id → campaigns (nullable), organisation_id → organisations, amount (check > 0), currency, payment_method, payment_reference, payment_status (default pending), is_recurring, recurring_frequency, parent_donation_id (self-ref nullable), is_anonymous, message, tax_receipt_issued, tax_receipt_number, tax_receipt_issued_at, donated_at
- volunteer_opportunities: id, organisation_id → organisations, title, slug, description, short_description, location, location_address, start_date, end_date, start_time, end_time, slots_total, slots_filled (default 0), required_skills (text[]), preferred_skills (text[]), is_recurring, image_url, is_active, category — UNIQUE(organisation_id, slug)
- volunteer_assignments: id, volunteer_id → volunteers, opportunity_id → volunteer_opportunities, organisation_id → organisations, status (assignment_status default pending), applied_at, confirmed_at, completed_at, hours_served, attendance_notes, rating (check 1–5), feedback — UNIQUE(volunteer_id, opportunity_id)
- audit_logs: id, user_id → users (on delete set null), action (audit_action), table_name, record_id, changes (jsonb), ip_address, user_agent, timestamp, organisation_id

Add indexes on: users(lower(email)), donations(donor_id, campaign_id, organisation_id, donated_at), volunteer_assignments(volunteer_id, opportunity_id, organisation_id, status), audit_logs(user_id, table_name+record_id, timestamp).
```

---

## Prompt 3 — RLS + Triggers

```
Create supabase/migrations/002_rls_and_triggers.sql.

Enable RLS on all tables.

Create two helper functions:
- get_user_role(): returns the role from users where id = auth.uid()
- get_user_org_ids(): returns array of organisation_ids from user_organisations where user_id = auth.uid() and is_active = true

RLS policies:
- super_admin: full access to everything (USING get_user_role() = 'super_admin')
- org_admin: full access to campaigns, opportunities, assignments, donations, volunteers, donors — scoped to organisation_id = ANY(get_user_org_ids())
- volunteer: read active opportunities; insert/read/update own assignments; read/update own volunteer profile
- donor: read active campaigns; read/update own donor profile and donations
- users table: everyone can read/update only their own row (id = auth.uid()), super_admin sees all
- audit_logs: super_admin reads all; org_admin reads own org; others no access

Triggers:
1. handle_new_auth_user: AFTER INSERT on auth.users → insert into public.users using raw_user_meta_data for first_name, last_name, role
2. update_campaign_amount: AFTER INSERT OR UPDATE on donations → when payment_status becomes 'completed', increment campaigns.current_amount and donors.total_donated + donation_count
3. update_opportunity_slots: AFTER INSERT OR UPDATE on volunteer_assignments → increment/decrement volunteer_opportunities.slots_filled when status changes to/from 'confirmed'
4. update_volunteer_hours: AFTER UPDATE on volunteer_assignments → when status becomes 'completed', add hours_served to volunteers.total_hours_served
5. set_updated_at: BEFORE UPDATE on all tables → set updated_at = now()
```

---

## Prompt 4 — Auth + Zustand store

```
Generate Supabase TypeScript types: supabase gen types typescript --local > src/types/supabase.ts

Create src/lib/auth.ts with: signIn(email, password), signUp(data including first_name, last_name, role, pdpa_consent_given passed as user_metadata), signOut(), getCurrentUser(), getSession().

Create src/store/authStore.ts using Zustand:
- State: user, session, role, orgIds, isLoading
- On init: call supabase.auth.getSession() and fetch the user's row from the users table
- Subscribe to supabase.auth.onAuthStateChange to keep state in sync
- Expose: isSuperAdmin, isOrgAdmin, canAccessOrg(id)

Create src/store/uiStore.ts:
- State: activeOrgId (for org_admins switching between orgs), sidebarOpen
- Actions: setActiveOrg, toggleSidebar

Create src/pages/LoginPage.tsx: email + password form using React Hook Form + Zod, calls signIn, redirects to /dashboard on success.

Create src/pages/RegisterPage.tsx: first name, last name, email, password, phone (optional), role (volunteer or donor only), PDPA consent checkbox (required). Calls signUp, shows "check your email" on success.
```

---

## Prompt 5 — Data layer

```
Create a data access layer in src/lib/api/, one file per entity. Each function calls Supabase directly (RLS handles filtering automatically).

src/lib/api/organisations.ts: getOrganisations(), getOrganisation(id), createOrganisation(data), updateOrganisation(id, data), deactivateOrganisation(id)

src/lib/api/campaigns.ts: getCampaigns({ organisation_id?, is_active?, page, per_page }), getCampaign(id), getCampaignDonations(id, filters), createCampaign(data), updateCampaign(id, data)

src/lib/api/volunteers.ts: getVolunteers({ organisation_id?, search?, page, per_page }), getVolunteer(id), getVolunteerAssignments(id), createVolunteerProfile(data), updateVolunteerProfile(id, data)

src/lib/api/opportunities.ts: getOpportunities(filters), getOpportunity(id), getOpportunityRoster(id), createOpportunity(data), updateOpportunity(id, data), signUpForOpportunity(opportunityId, volunteerId), updateAssignmentStatus(id, status, hoursServed?)

src/lib/api/donations.ts: getDonations(filters), getDonation(id), createDonation(data), updateDonationStatus(id, status), issueTaxReceipt(id)

src/lib/api/donors.ts: getDonors(filters), getDonor(id), getDonorDonations(id)

src/lib/api/audit.ts: getAuditLogs(filters), createAuditLog(data) — call createAuditLog after every mutation

src/lib/api/users.ts: getUsers(filters), getUser(id), updateUser(id, data), deactivateUser(id), exportUserData(id) — fetches all user data across tables for PDPA requests

Create src/lib/queryKeys.ts with TanStack Query key factories for all entities.

Create custom hooks in src/hooks/ wrapping each API module with useQuery/useMutation, e.g. useCampaigns(filters), useCampaign(id), useCreateCampaign(), etc. Use optimistic updates on status-change mutations.
```

---

## Prompt 6 — Layout + shared components

```
Create the admin portal shell.

src/components/layout/DashboardLayout.tsx: fixed 240px sidebar + top bar + scrollable main area. Collapsible sidebar on mobile.

src/components/layout/Sidebar.tsx: role-aware nav links using useAuth hook. super_admin sees all sections. org_admin sees their org's sections only. Active link highlighted via TanStack Router.

src/components/layout/TopBar.tsx: page title, org switcher dropdown (org_admins with multiple orgs, reads/sets activeOrgId from uiStore), user avatar dropdown with logout.

Shared components in src/components/ui/:
- DataTable: built on TanStack Table v8 — sorting, pagination, column visibility, row selection, search input
- StatCard: metric card with icon, value, optional delta %
- PageHeader: title + description + right-side action buttons
- EmptyState: icon + title + description + optional CTA
- ConfirmDialog: wraps shadcn AlertDialog for destructive actions
- StatusBadge: coloured pill mapped to assignment_status and payment_status values
- RoleBadge: coloured pill for user roles
- SearchInput: debounced input (300ms) calling onChange
- ExportButton: triggers CSV download, shows loading spinner
- ImageUpload: shows current image or initials avatar, click to pick file, validates size/type, shows upload progress, calls onUpload(url) callback
```

---

## Prompt 7 — Pages

```
Build all pages using the shared components and hooks.

DashboardPage (role-aware):
- super_admin: stat cards (orgs, volunteers, donors, donations this month), Recharts LineChart of monthly donations over 12 months, top 5 campaigns by % funded, recent donations table
- org_admin: stat cards (volunteers, this month donations, open opportunities, pending applications), upcoming opportunities, recent signups

OrganisationsPage (super_admin only): DataTable of orgs with create/edit sheet using React Hook Form + Zod.

CampaignsPage: DataTable with org filter (super_admin), category, status, date range filters. CampaignDetailPage shows progress bar, edit form, donations tab.

OpportunitiesPage: DataTable. OpportunityDetailPage shows volunteer roster with confirm/complete/log-hours actions.

VolunteersPage: DataTable with skill filter. VolunteerDetailPage shows profile, assignment history, hours chart.

DonorsPage: DataTable. DonorDetailPage shows donation history, lifetime value, tax receipts.

DonationsPage: DataTable with org, campaign, status, payment method, date range filters. Issue receipt button on completed donations without one.

AuditLogsPage (super_admin + org_admin): read-only DataTable with action type, date range, user filters.

All pages: use skeleton loaders while TanStack Query is fetching, show EmptyState when no results, show toast (shadcn Sonner) on mutation success/error.
```

---

## Prompt 8 — Stripe + Edge Functions

```
Create supabase/functions/create-payment-intent/index.ts:
- Verify the JWT from the Authorization header using Supabase service role
- Accept: { amount, currency, campaign_id, donor_id }
- Create a Stripe PaymentIntent with that metadata
- Insert a pending donation record into the database
- Return: { clientSecret, donationId }

Create supabase/functions/stripe-webhook/index.ts:
- Verify Stripe signature using STRIPE_WEBHOOK_SECRET
- On payment_intent.succeeded: update donation to completed, set donated_at, generate tax_receipt_number as RCP-{YEAR}-{zero-padded-sequence}, set tax_receipt_issued = true. The DB trigger handles updating campaign.current_amount and donor totals.
- On payment_intent.payment_failed: update donation to failed
- Return 200 immediately

Create src/lib/stripe.ts: export stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

Create src/components/donations/DonationWidget.tsx:
- Preset amount buttons ($10, $25, $50, $100, $200) + custom amount input
- Anonymous toggle, optional message
- Stripe CardElement from @stripe/react-stripe-js
- On submit: POST to the create-payment-intent Edge Function, then stripe.confirmCardPayment(clientSecret)
- Show success/error state, invalidate TanStack Query cache on success

Set Edge Function secrets: supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Prompt 9 — Storage

```
Create supabase/migrations/003_storage.sql creating three buckets:
- profile-images: private, 2MB limit, jpeg/png/webp only
- org-logos: public, 1MB limit, jpeg/png/webp/svg
- campaign-images: public, 5MB limit, jpeg/png/webp

Add storage RLS policies:
- profile-images: user can upload/read path starting with their own user_id; super_admin full access
- org-logos: org_admin can upload for their org; public can read
- campaign-images: org_admin can upload for their org; public can read

Create src/lib/storage.ts: uploadProfileImage(userId, file), uploadOrgLogo(orgId, file), uploadCampaignImage(campaignId, file) — each returns the public/signed URL and updates the relevant DB record.

Integrate the existing ImageUpload component into: user profile edit form, organisation edit form, campaign create/edit form.
```

---

## Prompt 10 — Notifications + data retention

```
Create supabase/functions/send-notification/index.ts:
- Called via Supabase Database Webhook
- Trigger on new volunteer_assignments (status=pending): email the org admin
- Trigger on donations updated to completed: email the donor with their receipt details
- Use Resend API (RESEND_API_KEY secret) for sending plain HTML emails with CHARIS branding

Create supabase/functions/data-retention/index.ts:
- Anonymize users soft-deleted more than 30 days ago: set email to deleted_{id}@anonymized.local, clear name and phone
- Delete audit_logs older than 3 years
- Log execution to audit_logs

Schedule data retention monthly via pg_cron in supabase/migrations/004_cron.sql.

Add supabase secrets set RESEND_API_KEY=re_...
```

---

## Prompt 11 — Seed data + deployment

```
Create supabase/seed.sql with realistic test data:
- 3 organisations: Gebirah, JRS Singapore, Focolare
- 1 super_admin: admin@charis.org
- 1 org_admin per organisation
- 10 volunteers, 10 donors
- 3 active campaigns per org with varying progress
- 5 volunteer opportunities per org
- 50 sample donations spread across campaigns and orgs

Create .gitignore including: node_modules, dist, .env, .env.local, supabase/.temp.

Create vercel.json for SPA routing:
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }

Create .github/workflows/deploy.yml:
- Trigger: push to main branch
- Jobs:
  1. build-and-test: checkout, install deps, run tsc --noEmit, run vite build
  2. deploy (depends on build-and-test): uses Vercel CLI to deploy to production via `vercel --prod --token $VERCEL_TOKEN`
- Required GitHub secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

Create a Makefile:
- make setup: npm install, supabase start, supabase db push, supabase db seed
- make dev: run vite and supabase local in parallel
- make build: tsc --noEmit && vite build
- make deploy-edge: supabase functions deploy
- make db-push: supabase db push --linked

Create DEPLOYMENT.md covering:
- Initial setup: create GitHub repo, push code, connect repo to Vercel project, set GitHub secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- Vercel environment variables to set in the Vercel dashboard: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY
- How to apply DB migrations to production: supabase db push --linked
- How to deploy Edge Functions: supabase functions deploy
- How to register the Stripe webhook URL (points to the stripe-webhook Edge Function URL)
- How to configure Supabase Database Webhooks for notifications
- Git branching: work on feature branches, merge to main triggers auto-deploy to Vercel
```

---

## Rules for Cursor throughout

- The React app talks directly to Supabase — no separate backend server
- RLS enforces all data isolation — never filter by org in code as a substitute for RLS
- Service role key only in Edge Function secrets, never in the Vite bundle
- All data fetching via TanStack Query hooks — no raw API calls in components
- All forms use React Hook Form + Zod
- After every mutation, call createAuditLog and invalidate the relevant query cache
