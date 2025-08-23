-- Create the trigger function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_name text;
BEGIN
  -- For organization accounts, get the organization name from organization_codes
  IF (NEW.raw_user_meta_data->>'role' = 'organization') THEN
    SELECT organization_name INTO org_name
    FROM organization_codes
    WHERE code = NEW.raw_user_meta_data->>'organization_code';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,
    organization_code,
    created_at,
    updated_at
  ) VALUES (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies only if they don't exist
DO $$ 
BEGIN
  -- Drop and recreate "Users can read own profile" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Drop and recreate "Users can update own profile" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Drop and recreate "System can create profile on signup" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'System can create profile on signup'
  ) THEN
    CREATE POLICY "System can create profile on signup"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Add role check constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role = ANY (ARRAY['student'::text, 'organization'::text, 'admin'::text]));
  END IF;
END $$;