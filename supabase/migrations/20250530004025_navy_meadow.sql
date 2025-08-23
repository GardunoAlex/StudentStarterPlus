/*
  # Add avatar URL to profiles

  1. Changes
    - Add `avatar_url` column to `profiles` table
      - Type: text
      - Nullable: true (not all users will have an avatar)
      - Default: null

  2. Notes
    - This change is backward compatible as the new column is nullable
    - No data migration needed as this is a new optional field
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;