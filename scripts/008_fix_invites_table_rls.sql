-- Fix invites table RLS policies to remove circular dependency
-- Drop the problematic circular admin policy
DROP POLICY IF EXISTS "Admins can manage invites" ON invites;

-- Service role will bypass RLS, so we don't need complex policies
-- Just add a simple policy for reading invites (admins only via service role)
-- No INSERT policy needed - service role bypasses RLS

-- Verify the table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'invites'
ORDER BY ordinal_position;
