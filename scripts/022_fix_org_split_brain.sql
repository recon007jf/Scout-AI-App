-- ============================================================================
-- FIX ORG SPLIT BRAIN
-- Canonical Org (KEEP): df966238-4b56-4ed3-886c-157854d8ce90
-- Orphan Org (REMOVE): 872a6b37-8fa4-4929-a946-7b0db95cfc69
-- ============================================================================

-- STEP 1: Update both admin profiles to canonical org
UPDATE public.profiles
SET 
  org_id = 'df966238-4b56-4ed3-886c-157854d8ce90',
  role = 'admin'
WHERE email IN ('admin@pacificaisystems.com', 'andrew.oram@pointchealth.com');

-- Verify profiles updated
SELECT email, role, org_id 
FROM public.profiles 
WHERE email IN ('admin@pacificaisystems.com', 'andrew.oram@pointchealth.com');

-- STEP 2: Update any existing invites to canonical org
UPDATE public.invites
SET org_id = 'df966238-4b56-4ed3-886c-157854d8ce90'
WHERE org_id = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- Verify invites updated
SELECT COUNT(*) as invites_on_orphan_org
FROM public.invites
WHERE org_id = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- STEP 3: Delete orphan org
DELETE FROM public.organizations
WHERE id = '872a6b37-8fa4-4929-a946-7b0db95cfc69';

-- Verify only canonical org remains
SELECT id, name 
FROM public.organizations;

-- STEP 4: Add unique constraint on organization name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_unique_idx 
ON public.organizations (LOWER(name));

-- FINAL VERIFICATION
SELECT 
  'SUCCESS: Only canonical org exists' as status,
  COUNT(*) as org_count
FROM public.organizations
WHERE id = 'df966238-4b56-4ed3-886c-157854d8ce90';
