-- Migration: backfill_founder_quota_lock
-- Grandfathers existing Pro/Pro AI subscribers at their current question limit before
-- PLAN_LIMITS.pro/pro_ai drop to the new, lower per-period quota (see the pricing tier
-- audit's "trava de fundador" — anyone already subscribed keeps what they signed up for,
-- for as long as they stay subscribed; only new signups after this migration get the new,
-- lower default). Uses the existing customQuotaOverride field, which already takes
-- precedence over PLAN_LIMITS in QuotaService.resolveBaseQuestionsLimit — no new column
-- needed for this.
--
-- Idempotent: only touches rows where customQuotaOverride is still NULL, so re-running
-- this migration (or running it after an admin has already set a manual override) is a
-- no-op for anyone already covered.
--
-- Must run before or in the same deploy as the PLAN_LIMITS change in
-- config/constants/index.ts — otherwise existing subscribers see their quota drop for the
-- window between the code deploying and this migration running.

UPDATE "User" SET "customQuotaOverride" = 1500 WHERE "plan" = 'pro' AND "customQuotaOverride" IS NULL;
UPDATE "User" SET "customQuotaOverride" = 2500 WHERE "plan" = 'pro_ai' AND "customQuotaOverride" IS NULL;
