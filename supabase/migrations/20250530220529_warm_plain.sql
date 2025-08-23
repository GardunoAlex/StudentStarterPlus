-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to store organization data properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    organization_code,
    organization_name,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'organization_code',
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'organization' THEN (
        SELECT organization_name 
        FROM organization_codes 
        WHERE code = new.raw_user_meta_data->>'organization_code'
      )
      ELSE NULL
    END,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update existing organization profiles to use correct fields
UPDATE profiles
SET 
  organization_name = (
    SELECT organization_name 
    FROM organization_codes 
    WHERE code = profiles.organization_code
  ),
  first_name = NULL
WHERE role = 'organization' AND organization_code IS NOT NULL;