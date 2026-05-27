-- Run in Supabase SQL Editor if dashboard shows:
-- "infinite recursion detected in policy for relation donations/donors"
-- (Same as migration 003_fix_donations_donors_rls.sql)

CREATE OR REPLACE FUNCTION get_my_donor_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(id), '{}'::uuid[])
  FROM donors
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION donor_has_donation_in_orgs(
  p_donor_id uuid,
  p_org_ids uuid[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM donations d
    WHERE d.donor_id = p_donor_id
      AND d.organisation_id = ANY (p_org_ids)
  );
$$;

DROP POLICY IF EXISTS donations_donor_own ON donations;
CREATE POLICY donations_donor_own ON donations
  FOR SELECT
  USING (donor_id = ANY (get_my_donor_ids()));

DROP POLICY IF EXISTS donors_org_admin_select ON donors;
CREATE POLICY donors_org_admin_select ON donors
  FOR SELECT
  USING (donor_has_donation_in_orgs(id, get_user_org_ids()));
