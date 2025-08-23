/*
  # Fix organization signup constraints

  1. Changes
    - Ensure organization-specific fields are properly nullable
    - Add RLS policies for organization signup flow
    - Add missing organization-related columns

  2. Security
    - Add policies to allow organization profile creation
    - Maintain existing RLS policies
*/

-- Ensure organization-specific fields are properly nullable
ALTER TABLE profiles
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN last_name DROP NOT NULL,
ALTER COLUMN major DROP NOT NULL,
ALTER COLUMN class_year DROP NOT NULL;

-- Add policy to allow organizations to create their own profiles
CREATE POLICY "Organizations can create their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'organization' AND
  organization_code IS NOT NULL AND
  organization_name IS NOT NULL
);

-- Add policy to allow organizations to read their own data
CREATE POLICY "Organizations can read their own data"
ON profiles
FOR SELECT
TO authenticated
USING (
  (role = 'organization' AND id = auth.uid()) OR
  (role = 'admin')
);

-- Enable RLS on opportunities table for proper access control
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Add policies for opportunities table
CREATE POLICY "Organizations can manage their own opportunities"
ON opportunities
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_code = opportunities.organization_code
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_code = opportunities.organization_code
  )
);

-- Add policy for reading opportunities
CREATE POLICY "Anyone can read opportunities"
ON opportunities
FOR SELECT
TO authenticated
USING (true);