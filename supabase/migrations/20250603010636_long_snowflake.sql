/*
  # Fix organization authentication system

  1. Changes
    - Drop and recreate organization_auth table with correct structure
    - Update validation trigger
    - Add proper indexes and constraints

  2. Security
    - Maintain RLS policies
    - Ensure proper validation
*/

-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS organization_auth CASCADE;

CREATE TABLE organization_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE REFERENCES organization_codes(code) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX organization_auth_email_idx ON organization_auth(email);

-- Enable RLS
ALTER TABLE organization_auth ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Organizations can authenticate"
ON organization_auth
FOR SELECT
TO authenticated
USING (true);

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

-- Create validation trigger
CREATE OR REPLACE FUNCTION validate_organization_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify organization code and email match
  IF NOT EXISTS (
    SELECT 1 FROM organization_codes
    WHERE code = NEW.code
    AND email = NEW.email
  ) THEN
    RAISE EXCEPTION 'Invalid organization code or email';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_organization_auth_trigger
  BEFORE INSERT OR UPDATE ON organization_auth
  FOR EACH ROW
  EXECUTE FUNCTION validate_organization_auth();