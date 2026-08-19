-- Migration: add_auto_config_this_period
-- Per-period counter for AI auto-config (certification search + edital extraction),
-- metered separately from questionsGeneratedThisPeriod — see QuotaService.checkAndRecordAutoConfig.
--
-- Idempotent: IF NOT EXISTS on the new column.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "autoConfigThisPeriod" INTEGER NOT NULL DEFAULT 0;
