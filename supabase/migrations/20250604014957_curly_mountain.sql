/*
  # Fix organization management permissions

  1. Changes
    - Update RLS policies for opportunities table
    - Add proper checks for organization ownership
    - Allow organizations to manage their own opportunities
    - Maintain public read access

  2. Security
    - Ensure proper access control
    - Maintain data integrity
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
USING (true);

-- Allow organizations to manage their opportunities
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
      (profiles.organization_code = opportunities.organization_code)
      OR
      -- Allow if admin
      (profiles.role = 'admin')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Allow if organization code matches
      (profiles.organization_code = opportunities.organization_code)
      OR
      -- Allow if admin
      (profiles.role = 'admin')
    )
  )
);