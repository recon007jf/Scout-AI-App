-- First, let's see what columns actually exist in our key tables

-- 1. Check profiles table structure
SELECT 'PROFILES TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check organizations table structure  
SELECT 'ORGANIZATIONS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
ORDER BY ordinal_position;

-- 3. Check dossiers table structure (if it exists)
SELECT 'DOSSIERS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dossiers'
ORDER BY ordinal_position;

-- 4. Check admin profile's current org_id
SELECT 'ADMIN PROFILE ORG_ID:' as info;
SELECT email, org_id, role
FROM public.profiles
WHERE email = 'admin@pacificaisystems.com';

-- 5. Show both organizations
SELECT 'ALL ORGANIZATIONS:' as info;
SELECT org_uuid, name, created_at
FROM public.organizations
ORDER BY created_at;

-- 6. Count profiles per org
SELECT 'PROFILES PER ORG:' as info;
SELECT org_id, COUNT(*) as profile_count
FROM public.profiles
GROUP BY org_id;
