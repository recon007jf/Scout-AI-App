-- Step 1 & 2 & 3: Identify which org UUID is being used by admin and dossiers

-- Check admin profile org_id
SELECT 
  'ADMIN PROFILE' as source,
  email,
  org_id,
  role
FROM public.profiles 
WHERE email = 'admin@pacificaisystems.com';

-- Check Andrew's profile org_id (if exists)
SELECT 
  'ANDREW PROFILE' as source,
  email,
  org_id,
  role
FROM public.profiles 
WHERE email = 'andrew.oram@pointchealth.com';

-- Check which org_id is used by dossiers (grouped by org_id)
SELECT 
  'DOSSIERS' as source,
  org_id,
  COUNT(*) as dossier_count
FROM public.dossiers
GROUP BY org_id;

-- Check which org_id is used by invites (if any exist)
SELECT 
  'INVITES' as source,
  org_id,
  COUNT(*) as invite_count
FROM public.invites
GROUP BY org_id;

-- Show both organizations with creation timestamps
SELECT 
  'ORGANIZATIONS' as source,
  org_uuid,
  name,
  created_at
FROM public.organizations
ORDER BY created_at;

-- INTERPRETATION GUIDE:
-- The org_id that appears MOST frequently across profiles and dossiers
-- is your canonical UUID. Use that one in script 017.
