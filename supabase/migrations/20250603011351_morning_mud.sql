-- Drop the organization_auth table as we'll use Supabase Auth instead
DROP TABLE IF EXISTS organization_auth CASCADE;

-- Ensure test organization exists
INSERT INTO organization_codes (code, organization_name, email)
VALUES ('TEST123', 'Test Organization', 'test@org.com')
ON CONFLICT (code) DO NOTHING;