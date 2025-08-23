/*
  # Fix organization authentication system

  1. Changes
    - Add missing indexes
    - Update RLS policies
    - Fix authentication flow constraints

  2. Security
    - Ensure proper access control
    - Add necessary validation checks
*/

-- Add missing index for email lookups
CREATE INDEX IF NOT EXISTS organization_auth_email_idx ON organization_auth(email);

-- Update RLS policies
ALTER TABLE organization_auth ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Organizations can authenticate" ON organization_auth;
DROP POLICY IF EXISTS "Admins can manage organization auth" ON organization_auth;

-- Create new policies
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

-- Add validation trigger
CREATE OR REPLACE FUNCTION validate_organization_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure organization code exists
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