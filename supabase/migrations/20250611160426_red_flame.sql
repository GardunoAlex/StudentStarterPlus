/*
  Migration: Fix profiles RLS policies to remove recursion
  - Drops old problematic policies
  - Creates new safe policies for users, organizations, and admins
  - Uses auth.uid() and auth.jwt() correctly
  - Fully idempotent
*/

BEGIN;

-- 1. Drop any existing policies on profiles table
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Organizations can create organization profile" ON profiles;
DROP POLICY IF EXISTS "Organizations can update own profile" ON profiles;
DROP POLICY IF EXISTS "Organizations can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can insert all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can delete all profiles" ON profiles;

-- 2. Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. User policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Organization policies
DROP POLICY IF EXISTS "Organizations can create organization profile" ON profiles;
CREATE POLICY "Organizations can create organization profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND
    role = 'organization' AND
    organization_code IS NOT NULL
  );

DROP POLICY IF EXISTS "Organizations can update own profile" ON profiles;
CREATE POLICY "Organizations can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND role = 'organization')
  WITH CHECK (auth.uid() = id AND role = 'organization');

DROP POLICY IF EXISTS "Organizations can read own profile" ON profiles;
CREATE POLICY "Organizations can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND role = 'organization');

-- 5. Admin policies
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
CREATE POLICY "Admin users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
CREATE POLICY "Admin users can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin users can insert all profiles" ON profiles;
CREATE POLICY "Admin users can insert all profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin users can delete all profiles" ON profiles;
CREATE POLICY "Admin users can delete all profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

COMMIT;
