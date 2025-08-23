/*
  # Add email column to organization_codes table

  1. Changes
    - Add 'email' column to organization_codes table
      - Type: text
      - Not nullable
      - No default value

  2. Rationale
    - Email column is required for organization code management
    - Used to link organization codes with user accounts
*/

ALTER TABLE organization_codes
ADD COLUMN IF NOT EXISTS email text NOT NULL;