-- ==============================================================================
-- Trelio CRM: Complete Database & RLS Fix Script
-- Direct URL: https://supabase.com/dashboard/project/pqfkmvtcdyytfjafgber/sql/new
-- Paste this script into Supabase SQL Editor and click RUN
-- ==============================================================================

-- STEP 1: Fix commission_rate column precision
-- Change from numeric(4,3) which capped values at < 10.0 to numeric(5,2) (e.g. 15.00 for 15%)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'freelancers' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE freelancers ALTER COLUMN commission_rate TYPE numeric(5,2);
  END IF;
END $$;

-- STEP 2: Grant full read/write permissions on CRM tables
-- (Disabling RLS on these tables allows your CRM to upload leads and manage freelancers without permission errors)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calls') THEN
    ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- STEP 3: Guarantee Edoxe is set as Freelancer
UPDATE freelancers
SET is_admin = false
WHERE (LOWER(name) LIKE '%edoxe%' OR LOWER(email) LIKE '%edoxe%')
  AND LOWER(email) != 'therealdanish12@gmail.com';

-- STEP 4: Guarantee Danish is set as Administrator
UPDATE freelancers
SET is_admin = true
WHERE LOWER(email) = 'therealdanish12@gmail.com';

-- Check results
SELECT id, name, email, is_admin, commission_rate, status FROM freelancers;
