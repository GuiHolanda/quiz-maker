-- Migration: add_sprint_expires_at
-- Fixed-term access marker for the "Sprint" plan (90-day one-time payment, no renewal —
-- see the pricing tier audit's grade proposal). Every other plan is indefinite until
-- canceled, so nothing else in the quota model tracks an expiry; this column is only ever
-- set for plan = 'sprint'. Auth.session() checks it on every session read and downgrades
-- the user to 'free' the moment it's in the past — see auth.ts.
--
-- Idempotent: IF NOT EXISTS on the new column.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sprintExpiresAt" TIMESTAMP(3);
