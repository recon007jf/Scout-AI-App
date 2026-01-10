-- Add admin profile for Joseph (admin@pacificaisystems.com)
-- This enables the Team tab in Settings for sending invites

-- Get the user ID from Supabase auth.users
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the user ID for admin@pacificaisystems.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@pacificaisystems.com';

  -- If user exists, insert or update their profile with admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, role, email, full_name)
    VALUES (
      admin_user_id,
      'admin',
      'admin@pacificaisystems.com',
      'Joseph'
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      email = 'admin@pacificaisystems.com',
      updated_at = now();
    
    RAISE NOTICE 'Admin profile created/updated for user ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User admin@pacificaisystems.com not found in auth.users';
  END IF;
END $$;
