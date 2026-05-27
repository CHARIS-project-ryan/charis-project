-- RLS policies and triggers

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(organisation_id),
    '{}'::uuid[]
  )
  FROM user_organisations
  WHERE user_id = auth.uid()
    AND is_active = true;
$$;

-- SECURITY DEFINER helpers avoid donations ↔ donors RLS recursion
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

-- organisations
CREATE POLICY organisations_super_admin_all ON organisations
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY organisations_org_admin_select ON organisations
  FOR SELECT
  USING (id = ANY (get_user_org_ids()));

-- users
CREATE POLICY users_self_select ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY users_super_admin_all ON users
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY users_org_admin_select ON users
  FOR SELECT
  USING (
    get_user_role() = 'org_admin'
    AND EXISTS (
      SELECT 1
      FROM user_organisations uo
      WHERE uo.user_id = users.id
        AND uo.organisation_id = ANY (get_user_org_ids())
        AND uo.is_active = true
    )
  );

-- Applied in 005_users_org_admin_donor_select.sql (donor profiles for org admins)

-- user_organisations
CREATE POLICY user_organisations_super_admin_all ON user_organisations
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY user_organisations_org_admin_all ON user_organisations
  FOR ALL
  USING (organisation_id = ANY (get_user_org_ids()))
  WITH CHECK (organisation_id = ANY (get_user_org_ids()));

CREATE POLICY user_organisations_self_select ON user_organisations
  FOR SELECT
  USING (user_id = auth.uid());

-- campaigns
CREATE POLICY campaigns_super_admin_all ON campaigns
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY campaigns_org_admin_all ON campaigns
  FOR ALL
  USING (organisation_id = ANY (get_user_org_ids()))
  WITH CHECK (organisation_id = ANY (get_user_org_ids()));

CREATE POLICY campaigns_public_read ON campaigns
  FOR SELECT
  USING (
    is_active = true
    AND get_user_role() IN ('volunteer'::user_role, 'donor'::user_role)
  );

-- volunteer_opportunities
CREATE POLICY opportunities_super_admin_all ON volunteer_opportunities
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY opportunities_org_admin_all ON volunteer_opportunities
  FOR ALL
  USING (organisation_id = ANY (get_user_org_ids()))
  WITH CHECK (organisation_id = ANY (get_user_org_ids()));

CREATE POLICY opportunities_volunteer_read ON volunteer_opportunities
  FOR SELECT
  USING (
    is_active = true
    AND get_user_role() IN ('volunteer'::user_role, 'donor'::user_role)
  );

-- volunteer_assignments
CREATE POLICY assignments_super_admin_all ON volunteer_assignments
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY assignments_org_admin_all ON volunteer_assignments
  FOR ALL
  USING (organisation_id = ANY (get_user_org_ids()))
  WITH CHECK (organisation_id = ANY (get_user_org_ids()));

CREATE POLICY assignments_volunteer_own ON volunteer_assignments
  FOR ALL
  USING (
    volunteer_id IN (
      SELECT id FROM volunteers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    volunteer_id IN (
      SELECT id FROM volunteers WHERE user_id = auth.uid()
    )
  );

-- volunteers
CREATE POLICY volunteers_super_admin_all ON volunteers
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY volunteers_org_admin_all ON volunteers
  FOR ALL
  USING (
    get_user_role() = 'org_admin'
    AND EXISTS (
      SELECT 1
      FROM user_organisations uo
      WHERE uo.user_id = volunteers.user_id
        AND uo.organisation_id = ANY (get_user_org_ids())
        AND uo.role_in_org = 'member'
        AND uo.is_active = true
    )
  )
  WITH CHECK (
    get_user_role() = 'org_admin'
    AND EXISTS (
      SELECT 1
      FROM user_organisations uo
      WHERE uo.user_id = volunteers.user_id
        AND uo.organisation_id = ANY (get_user_org_ids())
        AND uo.role_in_org = 'member'
        AND uo.is_active = true
    )
  );

CREATE POLICY volunteers_self ON volunteers
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- donors
CREATE POLICY donors_super_admin_all ON donors
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY donors_org_admin_select ON donors
  FOR SELECT
  USING (donor_has_donation_in_orgs(id, get_user_org_ids()));

CREATE POLICY donors_self ON donors
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- donations
CREATE POLICY donations_super_admin_all ON donations
  FOR ALL
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY donations_org_admin_all ON donations
  FOR ALL
  USING (organisation_id = ANY (get_user_org_ids()))
  WITH CHECK (organisation_id = ANY (get_user_org_ids()));

CREATE POLICY donations_donor_own ON donations
  FOR SELECT
  USING (donor_id = ANY (get_my_donor_ids()));

-- audit_logs
CREATE POLICY audit_logs_super_admin_select ON audit_logs
  FOR SELECT
  USING (get_user_role() = 'super_admin');

CREATE POLICY audit_logs_org_admin_select ON audit_logs
  FOR SELECT
  USING (
    get_user_role() = 'org_admin'
    AND organisation_id = ANY (get_user_org_ids())
  );

CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organisations_set_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER donations_set_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER volunteer_opportunities_set_updated_at
  BEFORE UPDATE ON volunteer_opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER volunteer_assignments_set_updated_at
  BEFORE UPDATE ON volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- new auth user handler
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    pdpa_consent_given,
    pdpa_consent_date
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::user_role,
      'volunteer'::user_role
    ),
    COALESCE((NEW.raw_user_meta_data ->> 'pdpa_consent_given')::boolean, false),
    CASE
      WHEN COALESCE((NEW.raw_user_meta_data ->> 'pdpa_consent_given')::boolean, false)
      THEN now()
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- campaign amount on completed donation
CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'completed'
    AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'completed')
  THEN
    IF NEW.campaign_id IS NOT NULL THEN
      UPDATE campaigns
      SET current_amount = current_amount + NEW.amount
      WHERE id = NEW.campaign_id;
    END IF;

    UPDATE donors
    SET
      total_donated = total_donated + NEW.amount,
      donation_count = donation_count + 1
    WHERE id = NEW.donor_id;

    UPDATE donations
    SET donated_at = now()
    WHERE id = NEW.id
      AND donated_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER donations_update_campaign_amount
  AFTER INSERT OR UPDATE OF payment_status ON donations
  FOR EACH ROW EXECUTE FUNCTION update_campaign_amount();

-- opportunity slots
CREATE OR REPLACE FUNCTION update_opportunity_slots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE volunteer_opportunities
    SET slots_filled = slots_filled + 1
    WHERE id = NEW.opportunity_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status IS DISTINCT FROM 'confirmed' THEN
      UPDATE volunteer_opportunities
      SET slots_filled = GREATEST(slots_filled - 1, 0)
      WHERE id = NEW.opportunity_id;
    ELSIF OLD.status IS DISTINCT FROM 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE volunteer_opportunities
      SET slots_filled = slots_filled + 1
      WHERE id = NEW.opportunity_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER assignments_update_opportunity_slots
  AFTER INSERT OR UPDATE OF status ON volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION update_opportunity_slots();

-- volunteer hours
CREATE OR REPLACE FUNCTION update_volunteer_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
    AND (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'completed')
    AND NEW.hours_served IS NOT NULL
  THEN
    UPDATE volunteers
    SET total_hours_served = total_hours_served + NEW.hours_served
    WHERE id = NEW.volunteer_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER assignments_update_volunteer_hours
  AFTER UPDATE OF status ON volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION update_volunteer_hours();
