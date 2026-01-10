-- Step 1: Check admin profile org_id
SELECT 
  id as profile_id, 
  email, 
  org_id,
  CASE 
    WHEN org_id IS NULL THEN '❌ NULL - THIS IS THE PROBLEM'
    ELSE '✓ Has value'
  END as org_id_status
FROM public.profiles 
WHERE email = 'admin@pacificaisystems.com';

-- Step 2: Check all organizations
SELECT 
  id as org_id, 
  name as org_name,
  created_at
FROM public.organizations
ORDER BY created_at DESC;

-- Step 3: Check if admin's org_id matches any real organization
SELECT 
  p.email,
  p.org_id as profile_org_id,
  o.id as org_exists,
  CASE 
    WHEN p.org_id IS NULL THEN '❌ Profile has NULL org_id'
    WHEN o.id IS NULL THEN '❌ Profile org_id does not match any organization'
    ELSE '✓ Valid org_id reference'
  END as validation_status
FROM public.profiles p
LEFT JOIN public.organizations o ON p.org_id = o.id
WHERE p.email = 'admin@pacificaisystems.com';

-- Step 4: Check invites table structure to see what's required
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invites'
ORDER BY ordinal_position;
