-- FULL SCHEMA INSPECTION: Organizations, Profiles, Invites
-- This will reveal the exact primary key and foreign key relationships

-- =============================================================================
-- PART 1: ORGANIZATIONS TABLE
-- =============================================================================
SELECT '=== ORGANIZATIONS TABLE STRUCTURE ===' as section;

-- Show all columns in organizations table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
ORDER BY ordinal_position;

-- Show primary key constraint on organizations
SELECT '=== ORGANIZATIONS PRIMARY KEY ===' as section;
SELECT
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'organizations'
  AND tc.constraint_type = 'PRIMARY KEY';

-- Show actual organizations data
SELECT '=== ORGANIZATIONS DATA ===' as section;
SELECT * FROM public.organizations;

-- =============================================================================
-- PART 2: PROFILES TABLE
-- =============================================================================
SELECT '=== PROFILES TABLE STRUCTURE ===' as section;

-- Show all columns in profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Show foreign key constraints on profiles
SELECT '=== PROFILES FOREIGN KEYS ===' as section;
SELECT
    tc.constraint_name,
    kcu.column_name as from_column,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Show admin profiles
SELECT '=== ADMIN PROFILES DATA ===' as section;
SELECT id, email, org_id, role 
FROM public.profiles 
WHERE email IN ('admin@pacificaisystems.com', 'andrew.oram@pointchealth.com');

-- =============================================================================
-- PART 3: INVITES TABLE
-- =============================================================================
SELECT '=== INVITES TABLE STRUCTURE ===' as section;

-- Show all columns in invites table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invites'
ORDER BY ordinal_position;

-- Show foreign key constraints on invites
SELECT '=== INVITES FOREIGN KEYS ===' as section;
SELECT
    tc.constraint_name,
    kcu.column_name as from_column,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'invites'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Show any existing invites
SELECT '=== INVITES DATA ===' as section;
SELECT * FROM public.invites;

-- =============================================================================
-- DIAGNOSIS SUMMARY
-- =============================================================================
SELECT '=== DIAGNOSIS SUMMARY ===' as section;
SELECT 
    'Check if organizations PK is id or org_uuid' as check_1,
    'Check if profiles.org_id references the correct column' as check_2,
    'Check if invites.org_id references the correct column' as check_3,
    'Verify canonical org UUID exists in organizations table' as check_4;
