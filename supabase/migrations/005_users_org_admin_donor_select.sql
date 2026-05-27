-- Org admins can read donor user profiles when those donors gave to their org.
-- Without this, nested selects like donors(*, users(...)) return null for users.

CREATE OR REPLACE FUNCTION user_is_donor_in_orgs(
  p_user_id uuid,
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
    FROM donors d
    JOIN donations dn ON dn.donor_id = d.id
    WHERE d.user_id = p_user_id
      AND dn.organisation_id = ANY (p_org_ids)
  );
$$;

DROP POLICY IF EXISTS users_org_admin_donor_select ON users;
CREATE POLICY users_org_admin_donor_select ON users
  FOR SELECT
  USING (
    get_user_role() = 'org_admin'
    AND user_is_donor_in_orgs(id, get_user_org_ids())
  );
