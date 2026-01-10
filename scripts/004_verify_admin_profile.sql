-- Verify and fix admin profile
-- This script checks if the admin profile exists and creates/updates it if needed

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user ID for admin@pacificaisystems.com from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@pacificaisystems.com'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No user found with email admin@pacificaisystems.com in auth.users';
    RAISE NOTICE 'Please check if the user exists in Supabase Auth';
  ELSE
    RAISE NOTICE 'Found user ID: %', admin_user_id;
    
    -- Delete any existing profile for this user
    DELETE FROM public.profiles WHERE id = admin_user_id;
    
    -- Insert fresh admin profile
    INSERT INTO public.profiles (id, role, email, full_name)
    VALUES (
      admin_user_id,
      'admin',
      'admin@pacificaisystems.com',
      'admin'
    );
    
    RAISE NOTICE 'Admin profile created successfully';
    
    -- Show the profile to confirm
    RAISE NOTICE 'Profile data:';
    PERFORM * FROM public.profiles WHERE id = admin_user_id;
  END IF;
END $$;

-- Show all profiles for verification
SELECT id, email, role, full_name, created_at
FROM public.profiles
ORDER BY created_at DESC;
