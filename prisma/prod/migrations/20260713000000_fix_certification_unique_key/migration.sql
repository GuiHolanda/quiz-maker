-- Drop the old single-column unique index on Certification.key
-- (created in 20260617000000_add_users_and_all_missing_tables but never updated
-- when the schema was changed to @@unique([userId, key]))
DROP INDEX IF EXISTS "public"."Certification_key_key";

-- Add the correct compound unique index (userId, key) if it does not exist yet
CREATE UNIQUE INDEX IF NOT EXISTS "Certification_userId_key_key" ON "public"."Certification"("userId", "key");
