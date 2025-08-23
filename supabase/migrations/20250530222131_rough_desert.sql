-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to properly handle organization data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_data RECORD;
BEGIN
  -- For organization accounts, get the organization data
  IF (NEW.raw_user_meta_data->>'role' = 'organization') THEN
    SELECT * INTO org_data
    FROM organization_codes
    WHERE code = NEW.raw_user_meta_data->>'organization_code';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization code not found';
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    organization_code,
    organization_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'organization' 
      THEN NEW.raw_user_meta_data->>'organization_code'
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'organization' 
      THEN org_data.organization_name
      ELSE NULL
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing organization profiles to ensure data consistency
UPDATE profiles p
SET organization_name = oc.organization_name
FROM organization_codes oc
WHERE p.role = 'organization' 
AND p.organization_code = oc.code
AND (p.organization_name IS NULL OR p.organization_name != oc.organization_name);