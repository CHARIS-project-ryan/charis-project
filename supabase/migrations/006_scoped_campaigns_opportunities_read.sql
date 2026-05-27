-- Org admins were seeing every active campaign/opportunity via public read policies,
-- but organisation names were hidden by organisations_org_admin_select (only their orgs).
-- Scope public read to volunteer/donor roles only.

DROP POLICY IF EXISTS campaigns_public_read ON campaigns;
CREATE POLICY campaigns_public_read ON campaigns
  FOR SELECT
  USING (
    is_active = true
    AND get_user_role() IN ('volunteer'::user_role, 'donor'::user_role)
  );

DROP POLICY IF EXISTS opportunities_volunteer_read ON volunteer_opportunities;
CREATE POLICY opportunities_volunteer_read ON volunteer_opportunities
  FOR SELECT
  USING (
    is_active = true
    AND get_user_role() IN ('volunteer'::user_role, 'donor'::user_role)
  );
