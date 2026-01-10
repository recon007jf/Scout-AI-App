-- Fix RLS policies to avoid circular dependency

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Allow all authenticated users to read their own profile (simple, no circular dependency)
CREATE POLICY "Users can read own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- No separate admin policy - users can only read their own profile
-- This prevents circular dependency where checking admin role requires reading profiles
-- Admin functionality will be enforced at the API layer with service role key
