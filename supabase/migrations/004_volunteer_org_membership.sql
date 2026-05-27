-- Volunteer ↔ organisation membership via user_organisations (explicit join, role_in_org = 'member')
-- Org admins (role_in_org = 'admin') manage the org; volunteers are members, not admins.

CREATE OR REPLACE FUNCTION user_is_volunteer_member_of_org(
  p_user_id uuid,
  p_org_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_organisations uo
    WHERE uo.user_id = p_user_id
      AND uo.organisation_id = p_org_id
      AND uo.role_in_org = 'member'
      AND uo.is_active = true
  );
$$;

DROP POLICY IF EXISTS volunteers_org_admin_all ON volunteers;
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
