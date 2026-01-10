-- Drop the problematic circular admin policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Drop the circular policy on invites too
DROP POLICY IF EXISTS "Admins can manage invites" ON invites;

-- Verify the remaining policies
-- Users should only be able to read and update their own profile
-- Admin operations will use the service role key at the API layer

-- Show current policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'invites');
