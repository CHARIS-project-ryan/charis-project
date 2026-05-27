-- Run in Supabase SQL Editor if Campaigns/Opportunities show "—" for Organisation
-- (org admin sees other orgs' rows but cannot read their organisation names).
-- Same as migration 006_scoped_campaigns_opportunities_read.sql

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
