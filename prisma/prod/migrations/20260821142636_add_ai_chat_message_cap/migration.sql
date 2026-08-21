-- Migration: add_ai_chat_message_cap
-- achado 15 of the pricing tier audit: AI Chat was metered (MetricsService logged tokens)
-- but never capped, on the single feature that justifies Pro AI's 2x price over Pro.
-- aiChatMessagesThisPeriod tracks messages sent this 30-day window, same reset mechanism
-- as questionsGeneratedThisPeriod/autoConfigThisPeriod (QuotaService.getUserWithPeriodReset).
-- The cap itself (300/month for pro_ai and sprint, per the audit's proposed grade) lives in
-- PLAN_LIMITS, not in the database.
--
-- Idempotent: IF NOT EXISTS on the new column.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiChatMessagesThisPeriod" INTEGER NOT NULL DEFAULT 0;
