/*
  # Fix opportunities RLS policy for public access

  1. Changes
    - Allow public read access to opportunities
    - Maintain existing policies for management
    
  2. Security
    - Only allow reading opportunities without authentication
    - Keep write operations restricted to authenticated users
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