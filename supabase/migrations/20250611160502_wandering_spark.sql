/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop all existing recursive policies on profiles table
    - Create new non-recursive policies that avoid circular dependencies
    - Use auth.uid() and JWT metadata instead of querying profiles table
    - Add proper admin policies using JWT metadata

  2. Security
    - Maintain proper access control without recursion
    - Allow users to manage their own profiles
    - Allow admins to manage all profiles using JWT metadata
    - Allow organization profile creation during signup
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Organizations can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Organizations can manage their profile" ON profiles;
DROP POLICY IF EXISTS "Organizations can read their own data" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can insert all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can delete all profiles" ON profiles;

-- Create new non-recursive policies

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup (for the user's own profile)
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow organizations to create profiles with organization role
-- This is a separate policy for organization signup

DROP POLICY IF EXISTS "Organizations can create organization profile" ON profiles;

CREATE POLICY "Organizations can create organization profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND 
    role = 'organization' AND 
    organization_code IS NOT NULL
  );

-- Admin policies using JWT metadata to avoid recursion
-- Check if user has admin role in their JWT metadata
CREATE POLICY "Admin users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  );

CREATE POLICY "Admin users can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  );

CREATE POLICY "Admin users can insert all profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  );

CREATE POLICY "Admin users can delete all profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;