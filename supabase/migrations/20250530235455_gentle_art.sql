-- First ensure the trigger function exists and is properly configured
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    organization_code,
    organization_name,
    first_name,
    last_name,
    major,
    class_year
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'organization_code',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'major',
    new.raw_user_meta_data->>'class_year'
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error details
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Organizations can manage their profile" ON public.profiles;

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id OR 
  (
    auth.uid() IS NULL AND 
    role = 'organization'
  )
);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow organizations to manage their profile
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