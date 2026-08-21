-- Migration: add_bonus_questions
-- Additive, non-expiring quota top-up for the referral program: bonusQuestions
-- extends a user's period question limit without overwriting customQuotaOverride
-- (see achado 10 of the pricing tier audit — the old override-only field made any
-- bonus grant get silently wiped by an admin override or a plan upgrade).
-- bonusQuestionsConsumed on UsageLog records how much of a given generation call
-- was charged against the bonus balance, so a failed/rolled-back generation can
-- restore exactly that amount instead of guessing.
--
-- Idempotent: IF NOT EXISTS on both new columns.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bonusQuestions" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UsageLog" ADD COLUMN IF NOT EXISTS "bonusQuestionsConsumed" INTEGER NOT NULL DEFAULT 0;
