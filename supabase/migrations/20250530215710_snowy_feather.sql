/*
  # Fix organization signup issues

  1. Changes
    - Add organization_name column to profiles table
    - Update handle_new_user trigger to handle organization data
    - Add RLS policies for organization signup

  2. Security
    - Enable RLS on profiles table
    - Add policies for profile creation and management
*/

-- Add organization_name column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'organization_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_name text;
  END IF;
END $$;

-- Drop and recreate the handle_new_user trigger function to properly handle organization data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    organization_code,
    organization_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'student'),
    (NEW.raw_user_meta_data->>'organization_code')::text,
    (NEW.raw_user_meta_data->>'organization_name')::text
  );
  RETURN NEW;
END;
$$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add policy for system to create profiles during signup
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'System can create profile on signup'
  ) THEN
    CREATE POLICY "System can create profile on signup"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;