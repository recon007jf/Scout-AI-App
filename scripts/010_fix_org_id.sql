-- BEFORE RUNNING THIS: 
-- 1. Run script 009 first to get the correct organization UUID
-- 2. Replace 'PASTE_ORG_UUID_HERE' with the actual organizations.id from step 2 of script 009
-- 3. If no organizations exist, create one first (see commented section below)

-- OPTION A: If organizations table is empty, create one first
-- INSERT INTO public.organizations (name) 
-- VALUES ('Pacific AI Systems')
-- RETURNING id, name;

-- OPTION B: Update admin profile with correct org_id
-- Replace 'PASTE_ORG_UUID_HERE' with the UUID from organizations.id
UPDATE public.profiles 
SET org_id = 'PASTE_ORG_UUID_HERE'
WHERE email = 'admin@pacificaisystems.com'
RETURNING id, email, org_id;

-- Verify the fix
SELECT 
  p.email,
  p.org_id,
  o.name as organization_name,
  '✓ Fixed!' as status
FROM public.profiles p
JOIN public.organizations o ON p.org_id = o.id
WHERE p.email = 'admin@pacificaisystems.com';
