-- Add LLM draft columns to target_brokers table
ALTER TABLE target_brokers 
ADD COLUMN IF NOT EXISTS llm_email_subject TEXT,
ADD COLUMN IF NOT EXISTS llm_email_body TEXT,
ADD COLUMN IF NOT EXISTS llm_draft_generated_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_target_brokers_llm_drafts 
ON target_brokers(llm_email_subject, llm_email_body) 
WHERE llm_email_subject IS NOT NULL;

-- Update RLS policy to allow updates to LLM draft columns
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update target drafts" ON target_brokers;

-- Create new policy allowing authenticated users to update target drafts
CREATE POLICY "Users can update target drafts" 
ON target_brokers 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Ensure select policy exists for authenticated users
DROP POLICY IF EXISTS "Users can view targets" ON target_brokers;
CREATE POLICY "Users can view targets" 
ON target_brokers 
FOR SELECT 
TO authenticated 
USING (true);
