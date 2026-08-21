-- Migration: add_utm_attribution
-- UTM capture (pricing tier audit, priority action 1): before this, a campaign link's
-- utm_source/utm_medium/utm_campaign died on the landing page with nowhere to persist to.
-- These three are set once, at registration, from a first-touch cookie captured by
-- app/(marketing)/components/UtmCapture.tsx and read server-side in RegisterService and
-- auth.ts's events.createUser (same two call sites as referralCode/referredByUserId).
-- utm_term/utm_content are deliberately not included — this product runs no paid search
-- today, so those two would sit null on every row.
--
-- Idempotent: IF NOT EXISTS on all three columns, matching add_referral_attribution.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
