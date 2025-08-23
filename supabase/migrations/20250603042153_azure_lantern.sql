-- Ensure organization_codes table has correct structure
CREATE TABLE IF NOT EXISTS organization_codes (
  code TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE organization_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Organizations can read own code" ON organization_codes;
DROP POLICY IF EXISTS "Admins can manage organization codes" ON organization_codes;

-- Update policies
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

-- Insert test organization if it doesn't exist
INSERT INTO organization_codes (code, organization_name, email)
VALUES ('TEST123', 'Test Organization', 'test@org.com')
ON CONFLICT (code) DO NOTHING;