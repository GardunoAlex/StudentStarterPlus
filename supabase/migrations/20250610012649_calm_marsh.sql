/*
  # Fix organization edit policies

  1. Changes
    - Update RLS policies to allow organizations to edit their own opportunities
    - Fix policy logic for organization management
    - Ensure proper permission checking

  2. Security
    - Maintain security while allowing proper editing
    - Keep admin access intact
*/

-- Enable RLS on opportunities table
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read opportunities" ON opportunities;
DROP POLICY IF EXISTS "Organizations can manage their own opportunities" ON opportunities;

-- Create new policies
CREATE POLICY "Anyone can read opportunities"
ON opportunities
FOR SELECT
TO public
USING (true);

-- Allow organizations to manage their opportunities (including updates)
CREATE POLICY "Organizations can manage their own opportunities"
ON opportunities
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Allow if organization code matches
      profiles.organization_code = opportunities.organization_code
      OR
      -- Allow if admin
      profiles.role = 'admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Allow if organization code matches
      profiles.organization_code = opportunities.organization_code
      OR
      -- Allow if admin
      profiles.role = 'admin'
    )
  )
);

-- Also ensure profiles table has proper policies for organization access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate profiles policies to ensure they work correctly
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Organizations can manage their profile" ON profiles;
DROP POLICY IF EXISTS "Organizations can read their own data" ON profiles;

-- Recreate profiles policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow profile creation during signup"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id OR 
  (auth.uid() IS NULL AND role = 'organization')
);

CREATE POLICY "Organizations can manage their profile"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'organization' AND 
  id = auth.uid()
)
WITH CHECK (
  role = 'organization' AND 
  id = auth.uid()
);

CREATE POLICY "Organizations can read their own data"
ON profiles
FOR SELECT
TO authenticated
USING (
  (role = 'organization' AND id = auth.uid()) OR
  (role = 'admin')
);