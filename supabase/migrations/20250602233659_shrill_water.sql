/*
  # Fix organization authentication system

  1. Changes
    - Add unique constraint on organization_auth email
    - Add RLS policies for proper authentication
    - Add trigger for organization_auth updates

  2. Security
    - Enable RLS
    - Add policies for authentication
*/

-- First ensure the organization_auth table exists with proper constraints
CREATE TABLE IF NOT EXISTS organization_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE REFERENCES organization_codes(code) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE organization_auth ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage organization auth" ON organization_auth;
DROP POLICY IF EXISTS "Organizations can authenticate" ON organization_auth;

-- Create new policies
CREATE POLICY "Admins can manage organization auth"
  ON organization_auth
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

CREATE POLICY "Organizations can authenticate"
  ON organization_auth
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_organization_auth_updated_at ON organization_auth;
CREATE TRIGGER update_organization_auth_updated_at
  BEFORE UPDATE ON organization_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();