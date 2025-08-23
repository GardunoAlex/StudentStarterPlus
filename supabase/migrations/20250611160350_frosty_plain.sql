/*
  # Fix Admin Organization Code Deletion

  1. Changes
    - Add RLS policy to allow admins to manage all profiles
    - This enables admins to disassociate profiles from organizations before deletion
    - Maintains existing security while allowing proper admin functionality

  2. Security
    - Only users with admin role can manage other profiles
    - Existing user policies remain unchanged
*/

-- Add policy to allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
  )
);