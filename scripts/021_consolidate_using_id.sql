-- Consolidate to Canonical Organization: df966238-4b56-4ed3-886c-157854d8ce90
-- This script moves admin profile to canonical org and deletes the orphan

BEGIN;

-- Step 1: Update admin profile to use canonical org
UPDATE public.profiles
SET org_id = 'df966238-4b56-4ed3-886c-157854d8ce90'
WHERE email = 'admin@pacificaisystems.com';

-- Step 2: Delete orphan organization (must have no references)
DELETE FROM public.organizations
WHERE id = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- Step 3: Add unique constraint on organization name
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_name_key;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_name_key UNIQUE (name);

-- Step 4: Verify the fix
SELECT 'Admin Profile Fixed:' AS check_type, email, org_id
FROM public.profiles
WHERE email = 'admin@pacificaisystems.com'
UNION ALL
SELECT 'Remaining Orgs:' AS check_type, id::text, name
FROM public.organizations
ORDER BY check_type, email;

COMMIT;
