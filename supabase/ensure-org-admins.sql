-- Gebirah / JRS / Focolare org admin demo accounts (run in SQL Editor)

UPDATE users
SET role = 'org_admin', first_name = 'Sarah', last_name = 'Chua'
WHERE email = 'sarah.chua@gebirah.sg';

UPDATE users
SET role = 'org_admin', first_name = 'John', last_name = 'Lim'
WHERE email = 'john.lim@jrs.net.sg';

UPDATE users
SET role = 'org_admin', first_name = 'Maria', last_name = 'Fernandez'
WHERE email = 'maria.fernandez@focolare.org';

INSERT INTO user_organisations (user_id, organisation_id, role_in_org, is_active)
SELECT u.id, o.id, 'admin', true
FROM users u
JOIN organisations o ON (
  (u.email = 'sarah.chua@gebirah.sg' AND o.slug = 'gebirah') OR
  (u.email = 'john.lim@jrs.net.sg' AND o.slug = 'jrs-singapore') OR
  (u.email = 'maria.fernandez@focolare.org' AND o.slug = 'focolare')
)
ON CONFLICT (user_id, organisation_id) DO NOTHING;
