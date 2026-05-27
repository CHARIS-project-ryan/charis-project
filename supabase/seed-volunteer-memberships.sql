-- Run after seed.sql if volunteer org memberships are missing
-- Model: explicit join → user_organisations (role_in_org = 'member')

INSERT INTO user_organisations (user_id, organisation_id, role_in_org, is_active)
SELECT u.id, o.id, 'member', true
FROM users u
JOIN organisations o ON (
  (u.email = 'siti.lee@email.com' AND o.slug IN ('gebirah', 'jrs-singapore')) OR
  (u.email = 'raj.kumar@email.com' AND o.slug = 'jrs-singapore') OR
  (u.email = 'mei.tan@email.com' AND o.slug = 'focolare')
)
ON CONFLICT (user_id, organisation_id) DO NOTHING;
