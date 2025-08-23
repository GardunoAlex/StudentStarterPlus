-- Create organization_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization_codes (
  code TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create opportunities table if it doesn't exist
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline DATE NOT NULL,
  gpa NUMERIC(3,2) NOT NULL,
  majors TEXT[] NOT NULL,
  class_years TEXT[] NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  industry TEXT NOT NULL,
  application_link TEXT NOT NULL,
  logo TEXT NOT NULL,
  organization_code TEXT REFERENCES organization_codes(code),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();