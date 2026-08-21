-- Migration: add_referral_attribution
-- Groundwork for the referral program ("indique um amigo") — captures who referred a new
-- signup, via a schema field rather than a third-party analytics tool. referralCode is each
-- user's own shareable invite code (generated at registration by RegisterService, nullable
-- here since existing users don't get one retroactively — it's lazily assigned whenever a
-- user first needs one). referredByUserId is set once, at registration, from a `?ref=` code
-- in the signup URL; nothing else in this change grants a reward for it yet — reward
-- granting depends on bonusQuestions (see migration add_bonus_questions) and is deliberately
-- out of scope until the activation-gating logic for it is designed.
--
-- Idempotent: IF NOT EXISTS on both new columns. The FK constraint and unique index are not
-- (Postgres has no IF NOT EXISTS form for ADD CONSTRAINT), matching every other
-- constraint-adding migration in this history — safety here comes from Prisma's own
-- migration tracking, not from re-run idempotency.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredByUserId" TEXT;

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
