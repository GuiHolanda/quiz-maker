-- Add inputTokens and outputTokens columns to UsageLog
ALTER TABLE "public"."UsageLog" ADD COLUMN "inputTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."UsageLog" ADD COLUMN "outputTokens" INTEGER NOT NULL DEFAULT 0;
