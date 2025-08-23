/*
  # Fix user signup and profiles configuration

  1. Changes
    - Add trigger function to handle new user creation
    - Update profiles table constraints
    - Add appropriate RLS policies for profiles
    - Ensure organization_codes table has correct constraints

  2. Security
    - Enable RLS on profiles table
    - Add policies for profile management
    - Ensure proper handling of organization roles
*/

-- First, create a function to handle new user creation
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
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Update profiles table constraints if needed
ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'student',
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for profiles
DO $$
BEGIN
  -- Users can read their own profile
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

  -- Users can update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- System can create profile on signup
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
END
$$;

-- Ensure organization_codes table has correct constraints
ALTER TABLE public.organization_codes
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN organization_name SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Enable RLS on organization_codes if not already enabled
ALTER TABLE public.organization_codes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for organization_codes
DO $$
BEGIN
  -- Only admins can manage organization codes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_codes' 
    AND policyname = 'Admins can manage organization codes'
  ) THEN
    CREATE POLICY "Admins can manage organization codes"
      ON public.organization_codes
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;

  -- Organizations can read their own code
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_codes' 
    AND policyname = 'Organizations can read own code'
  ) THEN
    CREATE POLICY "Organizations can read own code"
      ON public.organization_codes
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.organization_code = organization_codes.code
        )
      );
  END IF;
END
$$;