-- Fix empty dashboard donations — run in Supabase SQL Editor
-- Prerequisites: organisations + campaigns from seed.sql (or migrations + org/campaign inserts)

-- ─── 1. Diagnostics (check result grid) ─────────────────────────────────────
SELECT 'organisations' AS check_name, COUNT(*)::text AS value FROM organisations
UNION ALL SELECT 'campaigns', COUNT(*)::text FROM campaigns
UNION ALL SELECT 'donor_users', COUNT(*)::text FROM users
  WHERE email IN ('david.wong@email.com', 'priya.nair@email.com', 'ahmad.ali@email.com')
UNION ALL SELECT 'donors', COUNT(*)::text FROM donors
UNION ALL SELECT 'donations', COUNT(*)::text FROM donations
UNION ALL SELECT 'developer_role', COALESCE(
  (SELECT role::text FROM users WHERE email = 'developer@charis-singapore.org'),
  'MISSING'
);

-- ─── 2. Ensure demo login can read all rows (RLS) ───────────────────────────
UPDATE users
SET role = 'super_admin', first_name = 'CHARIS', last_name = 'Developer'
WHERE email = 'developer@charis-singapore.org';

-- ─── 3. Ensure donor profiles exist ───────────────────────────────────────────
INSERT INTO donors (user_id, total_donated, donation_count, is_active)
SELECT u.id, 0, 0, true
FROM users u
WHERE u.email IN ('david.wong@email.com', 'priya.nair@email.com', 'ahmad.ali@email.com')
  AND NOT EXISTS (SELECT 1 FROM donors d WHERE d.user_id = u.id);

-- ─── 4. Insert donations (org_slug + campaign_slug = reliable joins) ────────
INSERT INTO donations (
  donor_id, campaign_id, organisation_id, amount, currency,
  payment_method, payment_status, donated_at, tax_receipt_issued, tax_receipt_number
)
SELECT d.id, c.id, o.id, v.amount, 'SGD', v.method::payment_method,
  'completed', v.donated_at::timestamptz, true, v.receipt
FROM (VALUES
  ('david.wong@email.com', 'gebirah', 'emergency-relief', 500, 'paynow', '2026-05-01', 'RCP-2026-00001'),
  ('david.wong@email.com', 'gebirah', 'education-support', 200, 'credit_card', '2026-05-10', 'RCP-2026-00002'),
  ('priya.nair@email.com', 'jrs-singapore', 'refugee-legal-aid', 300, 'paynow', '2026-05-05', 'RCP-2026-00003'),
  ('priya.nair@email.com', 'jrs-singapore', 'language-classes', 500, 'bank_transfer', '2026-05-15', 'RCP-2026-00004'),
  ('ahmad.ali@email.com', 'jrs-singapore', 'housing-support', 5000, 'bank_transfer', '2026-04-20', 'RCP-2026-00005'),
  ('ahmad.ali@email.com', 'focolare', 'youth-unity-camp', 1000, 'credit_card', '2026-05-12', 'RCP-2026-00006'),
  ('ahmad.ali@email.com', 'focolare', 'family-support', 2000, 'cheque', '2026-03-08', 'RCP-2026-00007'),
  ('david.wong@email.com', 'gebirah', 'community-outreach', 150, 'paynow', '2026-04-28', 'RCP-2026-00008'),
  ('ahmad.ali@email.com', 'gebirah', 'emergency-relief', 3000, 'bank_transfer', '2026-02-14', 'RCP-2026-00009'),
  ('priya.nair@email.com', 'focolare', 'interfaith-dialogue', 100, 'paynow', '2026-05-20', 'RCP-2026-00010'),
  ('david.wong@email.com', 'gebirah', 'emergency-relief', 250, 'paynow', '2026-05-22', 'RCP-2026-00011'),
  ('david.wong@email.com', 'jrs-singapore', 'refugee-legal-aid', 400, 'credit_card', '2026-05-18', 'RCP-2026-00012'),
  ('priya.nair@email.com', 'jrs-singapore', 'housing-support', 750, 'bank_transfer', '2026-05-24', 'RCP-2026-00013'),
  ('priya.nair@email.com', 'focolare', 'youth-unity-camp', 200, 'paynow', '2026-05-08', 'RCP-2026-00014'),
  ('ahmad.ali@email.com', 'gebirah', 'emergency-relief', 1200, 'bank_transfer', '2026-05-25', 'RCP-2026-00015'),
  ('ahmad.ali@email.com', 'jrs-singapore', 'language-classes', 350, 'paynow', '2026-05-14', 'RCP-2026-00016'),
  ('david.wong@email.com', 'focolare', 'family-support', 180, 'paynow', '2025-12-10', 'RCP-2025-00020'),
  ('priya.nair@email.com', 'gebirah', 'education-support', 220, 'credit_card', '2025-11-05', 'RCP-2025-00021'),
  ('ahmad.ali@email.com', 'jrs-singapore', 'housing-support', 8000, 'bank_transfer', '2025-10-15', 'RCP-2025-00022'),
  ('ahmad.ali@email.com', 'jrs-singapore', 'refugee-legal-aid', 2500, 'cheque', '2025-09-20', 'RCP-2025-00023'),
  ('david.wong@email.com', 'gebirah', 'community-outreach', 90, 'paynow', '2025-08-12', 'RCP-2025-00024'),
  ('priya.nair@email.com', 'focolare', 'interfaith-dialogue', 150, 'paynow', '2025-07-08', 'RCP-2025-00025'),
  ('ahmad.ali@email.com', 'focolare', 'youth-unity-camp', 600, 'credit_card', '2025-06-18', 'RCP-2025-00026'),
  ('david.wong@email.com', 'gebirah', 'education-support', 120, 'paynow', '2026-04-05', 'RCP-2026-00027'),
  ('priya.nair@email.com', 'jrs-singapore', 'refugee-legal-aid', 450, 'bank_transfer', '2026-03-22', 'RCP-2026-00028'),
  ('ahmad.ali@email.com', 'focolare', 'family-support', 1500, 'bank_transfer', '2026-02-28', 'RCP-2026-00029'),
  ('david.wong@email.com', 'gebirah', 'emergency-relief', 300, 'paynow', '2026-01-15', 'RCP-2026-00030')
) AS v(donor_email, org_slug, campaign_slug, amount, method, donated_at, receipt)
JOIN users u ON u.email = v.donor_email
JOIN donors d ON d.user_id = u.id
JOIN organisations o ON o.slug = v.org_slug
JOIN campaigns c ON c.organisation_id = o.id AND c.slug = v.campaign_slug
WHERE NOT EXISTS (
  SELECT 1 FROM donations existing WHERE existing.tax_receipt_number = v.receipt
);

-- ─── 5. Refresh donor totals + campaign amounts ─────────────────────────────
UPDATE donors d
SET
  total_donated = sub.total,
  donation_count = sub.cnt
FROM (
  SELECT donor_id, SUM(amount) AS total, COUNT(*)::int AS cnt
  FROM donations
  WHERE payment_status = 'completed'
  GROUP BY donor_id
) sub
WHERE d.id = sub.donor_id;

UPDATE campaigns c
SET current_amount = COALESCE(sub.total, 0)
FROM (
  SELECT campaign_id, SUM(amount) AS total
  FROM donations
  WHERE payment_status = 'completed' AND campaign_id IS NOT NULL
  GROUP BY campaign_id
) sub
WHERE c.id = sub.campaign_id;

-- ─── 6. Verify (donations should be 27, developer_role super_admin) ─────────
SELECT 'donations_after' AS check_name, COUNT(*)::text AS value FROM donations
UNION ALL SELECT 'developer_role', COALESCE(
  (SELECT role::text FROM users WHERE email = 'developer@charis-singapore.org'),
  'MISSING'
);
