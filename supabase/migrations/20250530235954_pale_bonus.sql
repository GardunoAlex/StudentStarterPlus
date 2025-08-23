-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to handle both student and organization profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert the profile with proper role-specific data
  INSERT INTO public.profiles (
    id,
    email,
    role,
    organization_code,
    organization_name,
    first_name,
    last_name,
    major,
    class_year,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'organization' 
      THEN new.raw_user_meta_data->>'organization_code'
      ELSE NULL
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'organization' 
      THEN (
        SELECT organization_name 
        FROM organization_codes 
        WHERE code = new.raw_user_meta_data->>'organization_code'
      )
      ELSE NULL
    END,
    CASE
      WHEN new.raw_user_meta_data->>'role' = 'organization'
      THEN (
        SELECT organization_name 
        FROM organization_codes 
        WHERE code = new.raw_user_meta_data->>'organization_code'
      )
      ELSE new.raw_user_meta_data->>'first_name'
    END,
    CASE
      WHEN new.raw_user_meta_data->>'role' = 'organization'
      THEN NULL
      ELSE new.raw_user_meta_data->>'last_name'
    END,
    new.raw_user_meta_data->>'major',
    new.raw_user_meta_data->>'class_year',
    NOW(),
    NOW()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Organizations can manage their profile" ON public.profiles;

-- Create new policies
CREATE POLICY "Allow profile creation during signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id OR 
  (auth.uid() IS NULL AND role = 'organization')
);

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Organizations can manage their profile"
ON public.profiles
FOR ALL
TO authenticated
USING (
  role = 'organization' AND 
  id = auth.uid()
)
WITH CHECK (
  role = 'organization' AND 
  id = auth.uid()
);