-- Migration: add_referral_activation
-- Marks the moment a referred user's referral reward was granted (email verified — already
-- guaranteed by the credentials login gate in auth.ts — and first question batch generated
-- or first mock exam completed). Doubles as the duplicate-grant lock: ReferralService only
-- pays out when this column is still null, then sets it inside the same conditional update.
-- Idempotent: simple nullable column, no constraint or index involved.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralActivatedAt" TIMESTAMP(3);
