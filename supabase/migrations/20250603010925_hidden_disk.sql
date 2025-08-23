/*
  # Add test organization data

  1. Test Data
    - Organization code: TEST123
    - Email: test@org.com
    - Password: password123
*/

-- Insert test organization code
INSERT INTO organization_codes (code, organization_name, email)
VALUES ('TEST123', 'Test Organization', 'test@org.com')
ON CONFLICT (code) DO NOTHING;

-- Insert test organization auth
INSERT INTO organization_auth (code, email, password)
VALUES ('TEST123', 'test@org.com', 'password123')
ON CONFLICT (code) DO NOTHING;