-- Hotfix: AWS provider logoUrl was left NULL because the previous migration
-- used ON CONFLICT DO NOTHING and the provider already existed in the database.
UPDATE "Provider"
SET "logoUrl" = 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg'
WHERE name = 'AWS';
