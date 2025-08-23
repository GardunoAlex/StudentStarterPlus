-- Remove the name column constraint from organization_auth
ALTER TABLE organization_auth ALTER COLUMN name DROP NOT NULL;