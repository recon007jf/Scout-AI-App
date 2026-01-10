-- Step 1: Check admin profile org_id
-- Run this first to see if org_id is NULL or invalid
SELECT 
  id as profile_id,
  email,
  org_id,
  CASE 
    WHEN org_id IS NULL THEN '❌ NULL - MUST FIX'
    ELSE '✓ Has value'
  END as org_id_status
FROM public.profiles 
WHERE email = 'admin@pacificaisystems.com';

-- Step 2: Check organizations table
-- Copy the exact UUID from the id column for Pacific AI Systems
SELECT 
  id as org_uuid,
  name
FROM public.organizations;

-- Step 3: If org_id was NULL or wrong, use this to fix it:
-- REPLACE '<PASTE_EXACT_ORG_UUID_FROM_STEP_2>' with the actual UUID from step 2
-- UPDATE public.profiles 
-- SET org_id = '<PASTE_EXACT_ORG_UUID_FROM_STEP_2>' 
-- WHERE email = 'admin@pacificaisystems.com';

-- Step 4: Verify the fix worked
-- SELECT id, email, org_id FROM public.profiles WHERE email = 'admin@pacificaisystems.com';
