-- Run this in Supabase SQL Editor to fix "Database error querying schema" on login
-- Cause: seeded auth.users rows missing empty token columns + auth.identities

-- 1. Fix NULL token columns (GoTrue requires empty string, not NULL)
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE confirmation_token IS NULL
   OR email_change IS NULL
   OR email_change_token_new IS NULL
   OR recovery_token IS NULL;

-- 2. Create missing auth.identities rows (required for email login)
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email LIKE '%@%'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
  );

-- 3. Ensure demo admin role
UPDATE public.users
SET role = 'super_admin', first_name = 'CHARIS', last_name = 'Developer'
WHERE email = 'developer@charis-singapore.org';
