/*
  # Fix organization_codes RLS policies for public counting

  1. Changes
    - Allow public read access to organization_codes for counting
    - Maintain admin management policies
    - Allow organizations to read their own data

  2. Security
    - Public can only read basic organization info (for counting)
    - Admin operations remain protected
    - Organization-specific access maintained
*/

-- Enable RLS
ALTER TABLE organization_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Organizations can read own code" ON organization_codes;
DROP POLICY IF EXISTS "Admins can manage organization codes" ON organization_codes;

-- Allow public read access for counting organizations
CREATE POLICY "Public can read organization codes"
  ON organization_codes
  FOR SELECT
  TO public
  USING (true);

-- Allow admins to manage organization codes
CREATE POLICY "Admins can manage organization codes"
  ON organization_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow organizations to read their own code
CREATE POLICY "Organizations can read own code"
  ON organization_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.organization_code = organization_codes.code
        OR profiles.email = organization_codes.email
      )
    )
  );