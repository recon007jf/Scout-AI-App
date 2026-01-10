-- Fix Org Split Brain - Only Update Tables That Have org_id Column
-- Canonical Org: df966238-4b56-4ed3-886c-157854d8ce90
-- Orphan Org: 872a6b37-8fa4-4929-a946-7b0db95cfc69

-- Step 1: Update admin profiles to canonical org
UPDATE public.profiles
SET org_id = 'df966238-4b56-4ed3-886c-157854d8ce90'
WHERE email IN ('admin@pacificaisystems.com', 'andrew.oram@pointchealth.com');

-- Step 2: Update any dossiers if they're on the wrong org
-- (We know dossiers are already on df966238, but double-check)
UPDATE public.dossiers
SET org_id = 'df966238-4b56-4ed3-886c-157854d8ce90'
WHERE org_id = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- Step 3: Delete orphan organization
DELETE FROM public.organizations
WHERE id = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- Step 4: Add unique constraint on organization name (prevent future duplicates)
ALTER TABLE public.organizations
ADD CONSTRAINT organizations_name_unique UNIQUE (name);

-- Verification queries
SELECT '=== VERIFICATION: Admin Profiles ===' as section;
SELECT email, org_id, role 
FROM public.profiles 
WHERE email IN ('admin@pacificaisystems.com', 'andrew.oram@pointchealth.com');

SELECT '=== VERIFICATION: Organizations Count ===' as section;
SELECT COUNT(*) as org_count, STRING_AGG(name, ', ') as org_names
FROM public.organizations;

SELECT '=== VERIFICATION: Dossiers Count ===' as section;
SELECT org_id, COUNT(*) as dossier_count
FROM public.dossiers
GROUP BY org_id;
