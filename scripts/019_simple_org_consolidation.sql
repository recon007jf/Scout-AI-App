-- STOP! Before running this script:
-- 1. Run script 018 first to see the actual schema and data
-- 2. Identify which org UUID the admin profile is using
-- 3. Replace the UUIDs below with the actual values

-- CANONICAL_ORG_UUID: The one currently used by admin profile (keep this one)
-- DUPLICATE_ORG_UUID: The one to delete

BEGIN;

-- Step 1: Update all profiles that point to duplicate org
UPDATE public.profiles
SET org_id = 'CANONICAL_ORG_UUID_HERE'  -- Replace with actual UUID
WHERE org_id = 'DUPLICATE_ORG_UUID_HERE';  -- Replace with actual UUID

-- Step 2: Delete the duplicate organization
DELETE FROM public.organizations
WHERE org_uuid = 'DUPLICATE_ORG_UUID_HERE';  -- Replace with actual UUID

-- Step 3: Verify only one org remains
SELECT 'REMAINING ORGANIZATIONS:' as info;
SELECT org_uuid, name, created_at
FROM public.organizations;

-- Step 4: Verify all profiles point to canonical org
SELECT 'PROFILES BY ORG:' as info;
SELECT org_id, COUNT(*) as count
FROM public.profiles
GROUP BY org_id;

-- If everything looks correct, commit. Otherwise rollback.
COMMIT;
-- To rollback instead: ROLLBACK;
