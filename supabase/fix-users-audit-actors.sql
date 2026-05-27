-- Run in Supabase SQL Editor if Audit Logs show "—" for User (e.g. CHARIS staff actions).
-- Same as migration 007_users_org_admin_audit_actor_select.sql

CREATE OR REPLACE FUNCTION user_appears_in_org_audit_logs(
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
    FROM audit_logs al
    WHERE al.user_id = p_user_id
      AND al.organisation_id = ANY (p_org_ids)
  );
$$;

DROP POLICY IF EXISTS users_org_admin_audit_actor_select ON users;
CREATE POLICY users_org_admin_audit_actor_select ON users
  FOR SELECT
  USING (
    get_user_role() = 'org_admin'
    AND user_appears_in_org_audit_logs(id, get_user_org_ids())
  );
