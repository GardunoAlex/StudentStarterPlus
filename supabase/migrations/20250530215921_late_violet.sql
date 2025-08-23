-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to store organization name in first_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_name text;
BEGIN
  -- For organization accounts, get the organization name
  IF (NEW.raw_user_meta_data->>'role' = 'organization') THEN
    SELECT organization_name INTO org_name
    FROM organization_codes
    WHERE code = NEW.raw_user_meta_data->>'organization_code';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,  -- Store organization name here for org accounts
    organization_code,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'student'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'organization' THEN org_name
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'organization' 
      THEN NEW.raw_user_meta_data->>'organization_code'
      ELSE NULL
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;