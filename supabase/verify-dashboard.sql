-- Quick check: data + role for demo login (run in SQL Editor)

SELECT 'donations' AS item, COUNT(*)::text AS value FROM donations
UNION ALL SELECT 'developer_role', COALESCE(
  (SELECT role::text FROM users WHERE email = 'developer@charis-singapore.org'),
  'NO USER ROW'
)
UNION ALL SELECT 'policy_donations_donor_own', CASE WHEN EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'donations' AND policyname = 'donations_donor_own'
    AND qual LIKE '%get_my_donor_ids%'
) THEN 'fixed' ELSE 'OLD — run fix-rls-recursion.sql' END;
