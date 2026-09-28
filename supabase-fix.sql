-- ==============================================================================
-- Trelio CRM: Complete Database & RLS Fix Script
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Fix commission_rate column precision
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

-- 2. Freelancers Policies (Allow authenticated users and admins to view and manage all freelancers)
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to freelancers" ON freelancers;
CREATE POLICY "Allow authenticated full access to freelancers"
ON freelancers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read freelancers" ON freelancers;
CREATE POLICY "Allow anon read freelancers"
ON freelancers FOR SELECT
TO anon
USING (true);

-- 3. Leads Policies (Allow admins and freelancers to view, upload, update, and delete leads)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to leads" ON leads;
CREATE POLICY "Allow authenticated full access to leads"
ON leads FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read leads" ON leads;
CREATE POLICY "Allow anon read leads"
ON leads FOR SELECT
TO anon
USING (true);

-- 4. Calls, Meetings, and Sales Policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calls') THEN
    ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated full access to calls" ON calls;
    CREATE POLICY "Allow authenticated full access to calls" ON calls FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated full access to meetings" ON meetings;
    CREATE POLICY "Allow authenticated full access to meetings" ON meetings FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated full access to sales" ON sales;
    CREATE POLICY "Allow authenticated full access to sales" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Guarantee edoxe is a Freelancer (is_admin = false)
UPDATE freelancers
SET is_admin = false
WHERE (LOWER(name) LIKE '%edoxe%' OR LOWER(email) LIKE '%edoxe%')
  AND LOWER(email) != 'therealdanish12@gmail.com';

-- 6. Guarantee Danish is an Administrator (is_admin = true)
UPDATE freelancers
SET is_admin = true
WHERE LOWER(email) = 'therealdanish12@gmail.com';

-- Check results
SELECT id, name, email, is_admin, commission_rate, status FROM freelancers;
