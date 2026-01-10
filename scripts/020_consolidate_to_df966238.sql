-- ============================================================================
-- CONSOLIDATE TO CANONICAL ORG: df966238-4b56-4ed3-886c-157854d8ce90
-- ============================================================================
-- This script fixes the split-brain org issue by:
-- 1. Moving admin profile from orphan org (872a6b37) to canonical org (df966238)
-- 2. Deleting the orphan organization
-- 3. Adding UNIQUE constraint to prevent future duplicates
-- ============================================================================

BEGIN;

-- Step 1: Move admin profile to canonical org
UPDATE public.profiles
SET org_id = 'df966238-4b56-4ed3-886c-157854d8ce90'
WHERE email = 'admin@pacificaisystems.com'
  AND org_id = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- Step 2: Verify admin profile is now on canonical org
SELECT 'Admin Profile Fixed:' as status, email, org_id 
FROM public.profiles 
WHERE email = 'admin@pacificaisystems.com';

-- Step 3: Delete the orphan organization
DELETE FROM public.organizations
WHERE org_uuid = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- Step 4: Verify only one organization remains
SELECT 'Remaining Organizations:' as status, org_uuid, name 
FROM public.organizations;

-- Step 5: Add UNIQUE constraint on organization name to prevent duplicates
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_name_unique;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_name_unique UNIQUE (name);

-- Step 6: Final verification
SELECT 'Final State:' as status;
SELECT 'Profiles:' as table_name, count(*) as count, org_id 
FROM public.profiles 
GROUP BY org_id;

SELECT 'Dossiers:' as table_name, count(*) as count, org_uuid 
FROM public.dossiers 
GROUP BY org_uuid;

SELECT 'Organizations:' as table_name, count(*) as total_orgs 
FROM public.organizations;

COMMIT;
