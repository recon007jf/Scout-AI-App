-- Fix the invites table constraint issue
-- The invited_by column is NOT NULL but defaults to NULL, causing inserts to fail

-- Option 1: Make invited_by nullable (simpler for MVP)
ALTER TABLE public.invites 
  ALTER COLUMN invited_by DROP NOT NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invites'
ORDER BY ordinal_position;
