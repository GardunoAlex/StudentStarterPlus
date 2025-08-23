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
    WHERE code = NEW.raw_user_meta_data->>'organization_code'
    AND email = NEW.email;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization code not found or email mismatch';
    END IF;

    INSERT INTO public.profiles (
      id,
      email,
      role,
      organization_code,
      organization_name,
      first_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'organization',
      org_data.code,
      org_data.organization_name,
      org_data.organization_name,
      NOW(),
      NOW()
    );
  ELSE
    -- Handle student accounts
    INSERT INTO public.profiles (
      id,
      email,
      role,
      first_name,
      last_name,
      major,
      class_year,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'student',
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'major',
      NEW.raw_user_meta_data->>'class_year',
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;