-- Debug script to verify admin profile exists and matches auth user

-- Show all auth users
SELECT 
  'Auth Users' as table_name,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'admin@pacificaisystems.com';

-- Show all profiles
SELECT 
  'Profiles' as table_name,
  id,
  role,
  email,
  full_name,
  created_at
FROM public.profiles;

-- Check if admin profile matches auth user
SELECT 
  'Match Status' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM auth.users au
      JOIN public.profiles p ON au.id = p.id
      WHERE au.email = 'admin@pacificaisystems.com' 
      AND p.role = 'admin'
    ) THEN 'MATCHED: Admin profile exists with correct user ID'
    ELSE 'MISMATCH: Admin profile missing or user ID does not match'
  END as result;
