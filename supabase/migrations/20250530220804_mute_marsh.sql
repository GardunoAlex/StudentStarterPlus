/*
  # Fix profiles table RLS policies

  1. Changes
    - Add new RLS policy to allow initial profile creation during signup
    - Keep existing policies for subsequent operations

  2. Security
    - Enables secure profile creation during signup
    - Maintains existing security for profile management
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "System can create profile on signup" ON profiles;

-- Create new insert policy that allows profile creation during signup
CREATE POLICY "Allow profile creation during signup"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the user is creating their own profile
  (auth.uid() = id)
  OR
  -- Allow during initial signup when auth.uid() might not be set
  (auth.uid() IS NULL AND role = 'organization')
);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;