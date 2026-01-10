-- After running script 014, replace KEEP_THIS_UUID with the org_uuid you want to keep
-- (usually the older one based on created_at)

-- Step 1: Update admin profile to use the canonical org_uuid (if needed)
UPDATE public.profiles 
SET org_id = 'REPLACE_WITH_UUID_TO_KEEP'
WHERE email = 'admin@pacificaisystems.com';

-- Step 2: Delete the duplicate organization
DELETE FROM public.organizations 
WHERE id = 'REPLACE_WITH_UUID_TO_DELETE';

-- Step 3: Verify only one org remains
SELECT id, name FROM public.organizations;

-- Step 4: Verify admin profile points to the correct org
SELECT email, org_id FROM public.profiles WHERE email = 'admin@pacificaisystems.com';
