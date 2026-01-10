-- Check which organization the admin profile is linked to
SELECT 
    p.id as profile_id,
    p.email,
    p.org_id as profile_org_id,
    o.name as org_name
FROM public.profiles p
LEFT JOIN public.organizations o ON p.org_id = o.id
WHERE p.email = 'admin@pacificaisystems.com';

-- Show both organizations for comparison
SELECT id, name, created_at 
FROM public.organizations 
ORDER BY created_at ASC;
