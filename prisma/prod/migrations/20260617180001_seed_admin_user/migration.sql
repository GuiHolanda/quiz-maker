-- Seed initial admin user
-- Email: gholanda04@gmail.com
-- Name: Guilherme Holanda
-- Password: guiguidado (bcrypt, cost 12)
INSERT INTO "User" (
    "id",
    "name",
    "email",
    "password",
    "plan",
    "questionsGeneratedThisPeriod",
    "periodStartDate",
    "createdAt"
)
VALUES (
    'cm_admin_guilherme_holanda',
    'Guilherme Holanda',
    'gholanda04@gmail.com',
    '$2b$12$.VYHbnll69tBjm4ghH/rhOw1VYCw79d1qUjAdpgKp4QHgHwNM6a/G',
    'admin',
    0,
    NOW(),
    NOW()
)
ON CONFLICT ("email") DO UPDATE SET
    "plan" = 'admin',
    "name" = 'Guilherme Holanda';
