/*
  # Add organization authentication table

  1. New Tables
    - `organization_auth`
      - `id` (uuid, primary key)
      - `code` (text, unique, references organization_codes)
      - `email` (text, unique)
      - `password_hash` (text)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add policy for organization authentication
*/

-- Create organization_auth table
CREATE TABLE organization_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE REFERENCES organization_codes(code) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE organization_auth ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage organization auth"
  ON organization_auth
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

CREATE POLICY "Organizations can authenticate"
  ON organization_auth
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Create updated_at trigger
CREATE TRIGGER update_organization_auth_updated_at
  BEFORE UPDATE ON organization_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();