-- Make name column nullable in organization_auth table
ALTER TABLE organization_auth ALTER COLUMN name DROP NOT NULL;

-- Update validation trigger to not check name
CREATE OR REPLACE FUNCTION validate_organization_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Only verify organization code and email match
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