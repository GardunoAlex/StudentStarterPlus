-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to properly handle organization profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  org_data RECORD;
BEGIN
  -- For organization accounts, get the organization data first
  IF (NEW.raw_user_meta_data->>'role' = 'organization') THEN
    SELECT * INTO org_data
    FROM organization_codes
    WHERE code = NEW.raw_user_meta_data->>'organization_code'
    AND email = NEW.email;
    
    IF FOUND THEN
      -- Create organization profile
      INSERT INTO public.profiles (
        id,
        email,
        role,
        organization_code,
        organization_name,
        first_name,  -- Store organization name as first_name for display purposes
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.email,
        'organization',
        org_data.code,
        org_data.organization_name,
        org_data.organization_name,  -- Use organization name for display
        NOW(),
        NOW()
      );
    ELSE
      RAISE NOTICE 'Organization code not found or email mismatch for %', NEW.email;
    END IF;
  ELSE
    -- Handle student/admin profiles
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
      COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'major',
      NEW.raw_user_meta_data->>'class_year',
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Organizations can read own code" ON organization_codes;
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
        OR profiles.role = 'admin'
      )
    )
  );