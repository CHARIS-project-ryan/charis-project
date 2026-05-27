-- CHARIS VDMS seed data — run in Supabase SQL Editor after migrations 001–002

-- ─── Organisations ───────────────────────────────────────────────────────────

INSERT INTO organisations (name, slug, description, contact_email, is_active)
VALUES
  ('Gebirah', 'gebirah', 'Supporting families and individuals in need across Singapore.', 'contact@gebirah.sg', true),
  ('JRS Singapore', 'jrs-singapore', 'Jesuit Refugee Service — accompaniment, advocacy, and assistance.', 'info@jrs.net.sg', true),
  ('Focolare', 'focolare', 'Building unity through the spirituality of communion.', 'singapore@focolare.org', true)
ON CONFLICT (slug) DO NOTHING;

-- ─── Campaigns (3 per org) ───────────────────────────────────────────────────

INSERT INTO campaigns (organisation_id, title, slug, short_description, goal_amount, current_amount, is_active, category)
SELECT o.id, v.title, v.slug, v.short_description, v.goal_amount, v.current_amount, true, v.category
FROM organisations o
CROSS JOIN (VALUES
  ('Emergency Relief Fund', 'emergency-relief', 'Urgent aid for families in crisis', 50000, 32000, 'Relief'),
  ('Education Support', 'education-support', 'School fees and supplies for children', 30000, 18500, 'Education'),
  ('Community Outreach', 'community-outreach', 'Weekly food distribution programme', 20000, 12000, 'Outreach')
) AS v(title, slug, short_description, goal_amount, current_amount, category)
WHERE o.slug = 'gebirah'
ON CONFLICT (organisation_id, slug) DO NOTHING;

INSERT INTO campaigns (organisation_id, title, slug, short_description, goal_amount, current_amount, is_active, category)
SELECT o.id, v.title, v.slug, v.short_description, v.goal_amount, v.current_amount, true, v.category
FROM organisations o
CROSS JOIN (VALUES
  ('Refugee Legal Aid', 'refugee-legal-aid', 'Legal assistance for asylum seekers', 40000, 28000, 'Legal'),
  ('Language Classes', 'language-classes', 'English and Mandarin tuition', 25000, 9000, 'Education'),
  ('Housing Support', 'housing-support', 'Temporary accommodation fund', 60000, 45000, 'Housing')
) AS v(title, slug, short_description, goal_amount, current_amount, category)
WHERE o.slug = 'jrs-singapore'
ON CONFLICT (organisation_id, slug) DO NOTHING;

INSERT INTO campaigns (organisation_id, title, slug, short_description, goal_amount, current_amount, is_active, category)
SELECT o.id, v.title, v.slug, v.short_description, v.goal_amount, v.current_amount, true, v.category
FROM organisations o
CROSS JOIN (VALUES
  ('Youth Unity Camp', 'youth-unity-camp', 'Annual camp for young people', 15000, 11000, 'Youth'),
  ('Interfaith Dialogue', 'interfaith-dialogue', 'Community dialogue events', 10000, 4500, 'Community'),
  ('Family Support Fund', 'family-support', 'Help for families in difficulty', 35000, 22000, 'Family')
) AS v(title, slug, short_description, goal_amount, current_amount, category)
WHERE o.slug = 'focolare'
ON CONFLICT (organisation_id, slug) DO NOTHING;

-- ─── Volunteer opportunities (2 per org) ─────────────────────────────────────

INSERT INTO volunteer_opportunities (organisation_id, title, slug, short_description, location, start_date, slots_total, slots_filled, is_active, category)
SELECT o.id, v.title, v.slug, v.short_description, v.location, v.start_date::date, v.slots_total, v.slots_filled, true, v.category
FROM organisations o
CROSS JOIN (VALUES
  ('Food Packing', 'food-packing', 'Pack food parcels for distribution', 'Gebirah Centre', '2026-06-15', 20, 8, 'Logistics'),
  ('Home Visits', 'home-visits', 'Visit families and provide companionship', 'Various locations', '2026-06-22', 10, 3, 'Pastoral')
) AS v(title, slug, short_description, location, start_date, slots_total, slots_filled, category)
WHERE o.slug = 'gebirah'
ON CONFLICT (organisation_id, slug) DO NOTHING;

INSERT INTO volunteer_opportunities (organisation_id, title, slug, short_description, location, start_date, slots_total, slots_filled, is_active, category)
SELECT o.id, v.title, v.slug, v.short_description, v.location, v.start_date::date, v.slots_total, v.slots_filled, true, v.category
FROM organisations o
CROSS JOIN (VALUES
  ('Legal Clinic Assistant', 'legal-clinic', 'Support weekly legal clinic sessions', 'JRS Office', '2026-06-10', 8, 5, 'Legal'),
  ('Translation Support', 'translation', 'Help with document translation', 'Remote / Office', '2026-06-18', 15, 6, 'Language')
) AS v(title, slug, short_description, location, start_date, slots_total, slots_filled, category)
WHERE o.slug = 'jrs-singapore'
ON CONFLICT (organisation_id, slug) DO NOTHING;

INSERT INTO volunteer_opportunities (organisation_id, title, slug, short_description, location, start_date, slots_total, slots_filled, is_active, category)
SELECT o.id, v.title, v.slug, v.short_description, v.location, v.start_date::date, v.slots_total, v.slots_filled, true, v.category
FROM organisations o
CROSS JOIN (VALUES
  ('Event Setup Crew', 'event-setup', 'Help set up community events', 'Focolare Centre', '2026-06-08', 12, 4, 'Events'),
  ('Children Programme Helper', 'children-programme', 'Assist with children activities', 'Focolare Centre', '2026-06-29', 6, 2, 'Youth')
) AS v(title, slug, short_description, location, start_date, slots_total, slots_filled, category)
WHERE o.slug = 'focolare'
ON CONFLICT (organisation_id, slug) DO NOTHING;

-- ─── Demo auth users (trigger creates public.users rows) ─────────────────────
-- Login: developer@charis-singapore.org / CharisDemo2026!

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'authenticated', 'authenticated',
    'developer@charis-singapore.org',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"CHARIS","last_name":"Developer","role":"super_admin","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'authenticated', 'authenticated',
    'siti.lee@email.com',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Siti","last_name":"Lee","role":"volunteer","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'authenticated', 'authenticated',
    'raj.kumar@email.com',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Raj","last_name":"Kumar","role":"volunteer","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'authenticated', 'authenticated',
    'mei.tan@email.com',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Mei","last_name":"Tan","role":"volunteer","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    'authenticated', 'authenticated',
    'david.wong@email.com',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"David","last_name":"Wong","role":"donor","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
    'authenticated', 'authenticated',
    'priya.nair@email.com',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Priya","last_name":"Nair","role":"donor","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
    'authenticated', 'authenticated',
    'ahmad.ali@email.com',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Ahmad","last_name":"Ali","role":"donor","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
    'authenticated', 'authenticated',
    'sarah.chua@gebirah.sg',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Sarah","last_name":"Chua","role":"org_admin","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9',
    'authenticated', 'authenticated',
    'john.lim@jrs.net.sg',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"John","last_name":"Lim","role":"org_admin","pdpa_consent_given":true}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
    'authenticated', 'authenticated',
    'maria.fernandez@focolare.org',
    crypt('CharisDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Maria","last_name":"Fernandez","role":"org_admin","pdpa_consent_given":true}',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- Ensure admin role for primary login account
UPDATE users
SET role = 'super_admin', first_name = 'CHARIS', last_name = 'Developer'
WHERE email = 'developer@charis-singapore.org';

-- Org memberships
INSERT INTO user_organisations (user_id, organisation_id, role_in_org, is_active)
SELECT u.id, o.id, 'admin', true
FROM users u
JOIN organisations o ON (
  (u.email = 'sarah.chua@gebirah.sg' AND o.slug = 'gebirah') OR
  (u.email = 'john.lim@jrs.net.sg' AND o.slug = 'jrs-singapore') OR
  (u.email = 'maria.fernandez@focolare.org' AND o.slug = 'focolare')
)
ON CONFLICT (user_id, organisation_id) DO NOTHING;

-- Volunteers
INSERT INTO volunteers (user_id, total_hours_served, is_active)
SELECT id, v.hours, true
FROM users u
JOIN (VALUES
  ('siti.lee@email.com', 48.5),
  ('raj.kumar@email.com', 72.0),
  ('mei.tan@email.com', 24.0)
) AS v(email, hours) ON u.email = v.email
ON CONFLICT (user_id) DO NOTHING;

-- Donors
INSERT INTO donors (user_id, total_donated, donation_count, is_active)
SELECT id, v.total, v.count, true
FROM users u
JOIN (VALUES
  ('david.wong@email.com', 2500, 5),
  ('priya.nair@email.com', 800, 2),
  ('ahmad.ali@email.com', 15000, 12)
) AS v(email, total, count) ON u.email = v.email
ON CONFLICT (user_id) DO NOTHING;

-- Donations (sample records — no Stripe, manually seeded)
INSERT INTO donations (donor_id, campaign_id, organisation_id, amount, currency, payment_method, payment_status, donated_at, tax_receipt_issued, tax_receipt_number)
SELECT d.id, c.id, c.organisation_id, v.amount, 'SGD', v.method::payment_method, 'completed', v.donated_at::timestamptz, true, v.receipt
FROM (VALUES
  ('david.wong@email.com', 'emergency-relief', 500, 'paynow', '2026-05-01', 'RCP-2026-00001'),
  ('david.wong@email.com', 'education-support', 200, 'credit_card', '2026-05-10', 'RCP-2026-00002'),
  ('priya.nair@email.com', 'refugee-legal-aid', 300, 'paynow', '2026-05-05', 'RCP-2026-00003'),
  ('priya.nair@email.com', 'language-classes', 500, 'bank_transfer', '2026-05-15', 'RCP-2026-00004'),
  ('ahmad.ali@email.com', 'housing-support', 5000, 'bank_transfer', '2026-04-20', 'RCP-2026-00005'),
  ('ahmad.ali@email.com', 'youth-unity-camp', 1000, 'credit_card', '2026-05-12', 'RCP-2026-00006'),
  ('ahmad.ali@email.com', 'family-support', 2000, 'cheque', '2026-03-08', 'RCP-2026-00007'),
  ('david.wong@email.com', 'community-outreach', 150, 'paynow', '2026-04-28', 'RCP-2026-00008'),
  ('ahmad.ali@email.com', 'emergency-relief', 3000, 'bank_transfer', '2026-02-14', 'RCP-2026-00009'),
  ('priya.nair@email.com', 'interfaith-dialogue', 100, 'paynow', '2026-05-20', 'RCP-2026-00010')
) AS v(donor_email, campaign_slug, amount, method, donated_at, receipt)
JOIN users u ON u.email = v.donor_email
JOIN donors d ON d.user_id = u.id
JOIN campaigns c ON c.slug = v.campaign_slug
WHERE NOT EXISTS (
  SELECT 1 FROM donations existing WHERE existing.tax_receipt_number = v.receipt
);

-- Volunteer assignments
INSERT INTO volunteer_assignments (volunteer_id, opportunity_id, organisation_id, status, hours_served)
SELECT vol.id, opp.id, opp.organisation_id, v.status::assignment_status, v.hours
FROM (VALUES
  ('siti.lee@email.com', 'food-packing', 'confirmed', NULL),
  ('siti.lee@email.com', 'home-visits', 'completed', 4.0),
  ('raj.kumar@email.com', 'legal-clinic', 'confirmed', NULL),
  ('raj.kumar@email.com', 'translation', 'pending', NULL),
  ('mei.tan@email.com', 'event-setup', 'completed', 6.0),
  ('mei.tan@email.com', 'children-programme', 'pending', NULL)
) AS v(vol_email, opp_slug, status, hours)
JOIN users u ON u.email = v.vol_email
JOIN volunteers vol ON vol.user_id = u.id
JOIN volunteer_opportunities opp ON opp.slug = v.opp_slug
ON CONFLICT (volunteer_id, opportunity_id) DO NOTHING;

-- Sample audit logs
INSERT INTO audit_logs (user_id, action, table_name, record_id, organisation_id, timestamp)
SELECT u.id, v.action::audit_action, v.table_name, NULL, o.id, v.ts::timestamptz
FROM (VALUES
  ('developer@charis-singapore.org', 'gebirah', 'create', 'organisations', '2026-05-20 09:00:00'),
  ('sarah.chua@gebirah.sg', 'gebirah', 'create', 'campaigns', '2026-05-21 14:30:00'),
  ('john.lim@jrs.net.sg', 'jrs-singapore', 'update', 'volunteer_opportunities', '2026-05-22 11:00:00'),
  ('maria.fernandez@focolare.org', 'focolare', 'create', 'donations', '2026-05-23 16:45:00'),
  ('developer@charis-singapore.org', 'gebirah', 'export', 'donations', '2026-05-24 10:00:00')
) AS v(user_email, org_slug, action, table_name, ts)
JOIN users u ON u.email = v.user_email
JOIN organisations o ON o.slug = v.org_slug;
