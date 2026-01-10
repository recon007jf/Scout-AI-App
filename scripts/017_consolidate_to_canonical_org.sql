-- Step 4, 5, 6: Consolidate everything to ONE canonical organization
-- 
-- INSTRUCTIONS: 
-- 1. Run script 016 first to identify the canonical UUID
-- 2. Replace 'CANONICAL_UUID_HERE' below with the UUID you chose
-- 3. Replace 'DUPLICATE_UUID_HERE' with the other UUID you want to delete
-- 4. Run this script

DO $$
DECLARE
  canonical_org_id UUID := 'CANONICAL_UUID_HERE'; -- REPLACE THIS
  duplicate_org_id UUID := 'DUPLICATE_UUID_HERE'; -- REPLACE THIS
BEGIN
  -- Step 4: Normalize all profiles to canonical org
  UPDATE public.profiles
  SET org_id = canonical_org_id
  WHERE org_id = duplicate_org_id OR org_id IS NULL;
  
  RAISE NOTICE 'Updated % profiles to canonical org', 
    (SELECT COUNT(*) FROM public.profiles WHERE org_id = canonical_org_id);
  
  -- Normalize all dossiers to canonical org
  UPDATE public.dossiers
  SET org_id = canonical_org_id
  WHERE org_id = duplicate_org_id OR org_id IS NULL;
  
  RAISE NOTICE 'Updated % dossiers to canonical org', 
    (SELECT COUNT(*) FROM public.dossiers WHERE org_id = canonical_org_id);
  
  -- Normalize all invites to canonical org (if any exist)
  UPDATE public.invites
  SET org_id = canonical_org_id
  WHERE org_id = duplicate_org_id OR org_id IS NULL;
  
  RAISE NOTICE 'Updated % invites to canonical org', 
    (SELECT COUNT(*) FROM public.invites WHERE org_id = canonical_org_id);
  
  -- Step 5: Delete the duplicate organization row
  DELETE FROM public.organizations
  WHERE org_uuid = duplicate_org_id;
  
  RAISE NOTICE 'Deleted duplicate organization';
  
  -- Step 6: Add uniqueness constraint on organization name
  -- (This may fail if constraint already exists - that's OK)
  BEGIN
    ALTER TABLE public.organizations
    ADD CONSTRAINT organizations_name_unique UNIQUE (name);
    RAISE NOTICE 'Added uniqueness constraint on organization name';
  EXCEPTION
    WHEN duplicate_table THEN
      RAISE NOTICE 'Uniqueness constraint already exists';
  END;
END $$;

-- Verify consolidation
SELECT 'FINAL STATE' as status;

SELECT 
  'Organizations' as table_name,
  COUNT(*) as row_count
FROM public.organizations;

SELECT 
  'Profiles by org' as table_name,
  org_id,
  COUNT(*) as count
FROM public.profiles
GROUP BY org_id;

SELECT 
  'Dossiers by org' as table_name,
  org_id,
  COUNT(*) as count
FROM public.dossiers
GROUP BY org_id;
