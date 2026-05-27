# CHARIS Volunteer & Donor Management System (VDMS)

Product documentation for the proof-of-concept (POC) built for **CHARIS Singapore**. This document describes what the system does, who it serves, and how the main concepts fit together. It is intended to evolve into formal product documentation.

For setup, deployment, and database troubleshooting, see the [README](../README.md).

---

## 1. Purpose

CHARIS coordinates multiple Catholic and community organisations across Singapore. The VDMS gives CHARIS and each member organisation a single place to:

- See **fundraising** progress (campaigns, donations, donors)
- Manage **volunteer** opportunities, memberships, and applications
- Maintain an **audit trail** of important actions for accountability and PDPA-aligned governance

The POC demonstrates end-to-end flows with realistic demo data (Gebirah, JRS Singapore, Focolare) and role-based access, without live payment processing.

---

## 2. Users and roles

| Role | Who | Scope |
|------|-----|--------|
| **Super admin** | CHARIS central staff | All organisations and platform-wide metrics |
| **Org admin** | Staff at a member organisation | Only organisations they administer |
| **Volunteer** | Individual volunteer (future self-service) | Own profile and assignments |
| **Donor** | Individual donor (future self-service) | Own giving history |

### Access model

- **Platform role** (`users.role`) determines what the dashboard shows and which navigation items appear.
- **Organisation membership** (`user_organisations`) links people to orgs with `role_in_org`: `admin`, `staff`, or `member`.
- **Volunteers** explicitly **join** an organisation (`role_in_org = member`). They are not inferred from assignments alone.
- **Donors** are linked to orgs through **completed donations**, not membership rows.
- Row-level security (RLS) in Supabase enforces scope; the UI does not bypass it.

### Navigation by role

| Area | Super admin | Org admin |
|------|:-----------:|:---------:|
| Dashboard (CHARIS-wide vs org-scoped) | ✓ all stats | ✓ org-scoped stats |
| Organisations list & detail | ✓ | — |
| Campaigns | ✓ all visible orgs | ✓ own org(s) only |
| Opportunities | ✓ | ✓ own org(s) only |
| Volunteers | ✓ | ✓ members at own org(s) |
| Donors | ✓ | ✓ donors with gifts at own org(s) |
| Donations | ✓ | ✓ own org(s) only |
| Audit logs | ✓ all | ✓ own org(s) only |

---

## 3. Feature overview

### 3.1 Authentication

- Email/password sign-in and registration (Supabase Auth)
- Session persisted in the browser; protected routes redirect unauthenticated users to login
- **Sign out** in the top bar and sidebar
- Sidebar shows signed-in **name** and **role label** (e.g. Org Admin)

### 3.2 Dashboard

Role-specific home page with summary **stat cards** (clickable for drill-down):

| Metric | Super admin | Org admin |
|--------|:-----------:|:---------:|
| Organisations | ✓ | — |
| Volunteers | ✓ (platform total) | ✓ (members at their org(s)) |
| Donors | ✓ | ✓ (with gifts at their org(s)) |
| Donations this month | ✓ | ✓ |
| Open opportunities | ✓ | ✓ |
| Pending applications | ✓ | ✓ |

**Drill-down sheet:** clicking a card opens a breakdown by organisation or donor, then navigates to the relevant **organisation detail tab** or **donor detail** page.

Super admins also see:

- **Monthly donations** line chart (last 12 months of completed gifts)
- **Top campaigns** by amount raised (progress bars)

### 3.3 Organisations (super admin)

- Directory of active member organisations
- **Organisation detail** with tabs:
  - **Overview** — summary stats
  - **Campaigns** — fundraising campaigns for that org
  - **Donations** — completed gifts (with donor names)
  - **Donors** — aggregated donors for that org
  - **Volunteers** — members who joined that org
  - **Opportunities** — volunteer postings
  - **Applications** — pending volunteer assignments

Drill-down from the dashboard lands on the matching tab (e.g. Donors → `?tab=donors`).

### 3.4 Campaigns

- List: title, organisation, progress (raised / goal), active status
- Search by campaign title
- **Detail:** progress bar, donation list with **donor name**, amount, status, date
- Org admins only see campaigns for their organisation(s)

### 3.5 Donations

- List: donor, organisation, campaign, amount, status, date
- Anonymous gifts shown as “Anonymous”
- Scoped by RLS to org admin’s organisations

### 3.6 Donors

- Directory: name, **organisations** (badges for multi-org givers), lifetime value, donation count
- **Detail:** summary and per-donation history with organisation and campaign links
- Organisation column reflects **completed** donations visible to the current user

### 3.7 Volunteers

- Directory: name, **organisations** (badges for multi-org members), email, hours served, status
- **Detail:** profile and assignment history with organisation and opportunity
- Org admins see volunteers with **member** membership at their org(s)

### 3.8 Volunteer opportunities

- List: opportunity, organisation, location, slots filled/total, date
- **Detail:** opportunity metadata and **roster** of assignments with status (pending, confirmed, completed, etc.)
- Org admins manage sign-ups within their org scope

### 3.9 Audit logs

Read-only **activity trail** for compliance:

- **Who** performed an action (user name)
- **What** action (`create`, `update`, `delete`, `login`, `logout`, `export`)
- **Which table** and **when**
- Scoped to organisation for org admins

The app writes audit entries when supported mutations occur (e.g. campaign create/update, donation status change, assignment update).

---

## 4. Key product concepts

### Multi-organisation volunteers

A volunteer can **join more than one** member organisation (e.g. Siti Lee → Gebirah and JRS Singapore). Membership is stored in `user_organisations` with `role_in_org = member`. Lists show all orgs the current user is allowed to see.

### Multi-organisation donors

A donor can give to **multiple** organisations (e.g. Ahmad Ali → JRS Singapore and Focolare). Lists derive organisation badges from **distinct completed donations**, not membership.

### Volunteer vs donor identity

- One **user** account can conceptually be both volunteer and donor; the schema uses separate `volunteers` and `donors` profile rows keyed by `user_id`.
- Platform role (`volunteer` / `donor` / `org_admin` / `super_admin`) is distinct from org membership.

### Fundraising

- **Campaigns** belong to one organisation; `current_amount` updates when donations are marked completed.
- Donations support payment method, status, tax receipt fields, and optional anonymity.
- **Stripe / live payments** are not integrated in the POC; donations are seeded or recorded administratively.

---

## 5. Demo data (POC)

Three organisations:

| Slug | Name |
|------|------|
| `gebirah` | Gebirah |
| `jrs-singapore` | JRS Singapore |
| `focolare` | Focolare |

Demo accounts (password `CharisDemo2026!` for all):

| Email | Role | Notes |
|-------|------|--------|
| `developer@charis-singapore.org` | Super admin | CHARIS-wide dashboard |
| `sarah.chua@gebirah.sg` | Org admin | Gebirah only |
| `john.lim@jrs.net.sg` | Org admin | JRS Singapore |
| `maria.fernandez@focolare.org` | Org admin | Focolare |

Additional seeded users: three volunteers, three donors, campaigns, opportunities, assignments, donations, and sample audit log rows.

---

## 6. Security and privacy

- **Supabase RLS** on all core tables; policies differ by `super_admin`, `org_admin`, and self-access
- **SECURITY DEFINER** helper functions avoid recursive policy loops (donations ↔ donors) and safely evaluate cross-table rules
- Org admins cannot read arbitrary user profiles; additional policies allow names for **donors**, **audit actors**, and **org members** relevant to their scope
- **PDPA:** registration captures consent flags on `users`; audit logs support accountability
- Client uses the **anon** key only; no service role in the browser

---

## 7. Technical architecture (summary)

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Routing | TanStack Router |
| Data fetching | TanStack Query (cache keyed by user + role for dashboard) |
| UI | Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, RLS) |
| Hosting | Vercel (SPA, `vercel.json` rewrites) |

Source layout:

- `src/pages/` — screen-level UI
- `src/lib/api/` — Supabase queries
- `src/store/authStore.ts` — session and role state
- `supabase/migrations/` — schema and RLS (001–007)
- `supabase/seed.sql` — demo data
- `supabase/fix-*.sql` — one-off SQL patches documented in README

---

## 8. Out of scope (POC)

The following were intentionally deferred:

- Stripe or other payment gateway integration
- Email notifications and receipts
- Volunteer/donor self-service portals (beyond register/login stubs)
- CRUD UI for creating organisations, campaigns, or opportunities in-app (seed/SQL only)
- Advanced reporting, exports beyond audit `export` action type
- Mobile-native apps

---

## 9. Suggested roadmap (from POC)

Possible next phases for productisation:

1. **Payments** — PayNow/card via Stripe; webhook → donation row + receipt
2. **Org admin tooling** — create/edit campaigns and opportunities in UI
3. **Volunteer journey** — browse opportunities, apply, confirm hours
4. **Donor journey** — give anonymously or named; tax receipt PDF
5. **CHARIS reporting** — cross-org dashboards, exports, scheduled reports
6. **Governance** — retention policies, audit log export, role delegation (`staff` vs `admin`)

---

## 10. Document history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | May 2026 | Initial POC product documentation |
