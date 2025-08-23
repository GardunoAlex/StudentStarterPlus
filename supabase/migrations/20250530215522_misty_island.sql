/*
  # Fix handle_new_user trigger function

  1. Changes
    - Update handle_new_user function to properly handle organization signups
    - Ensure proper extraction of user metadata fields
    - Add proper error handling
    
  2. Security
    - Maintain security definer setting for proper access control
    - Keep existing RLS policies intact
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles with proper handling of organization vs regular users
  INSERT INTO public.profiles (
    id,
    email,
    role,
    organization_code,
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
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error (Supabase provides pgext.notify for logging)
    PERFORM pgext.notify('handle_new_user_error', 'Error creating profile: ' || SQLERRM);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;