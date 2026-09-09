-- Migration: remove_ai_chat_message_cap
-- Feature AI Chat removida: nenhum codigo le ou escreve aiChatMessagesThisPeriod
-- (QuotaService parou de incrementar e de resetar a coluna). Espelha o DROP COLUMN
-- que o prisma migrate dev gerou para o SQLite via RedefineTables.
--
-- Idempotente: IF EXISTS. Os UsageLog historicos com action = 'ai_chat' permanecem.

ALTER TABLE "User" DROP COLUMN IF EXISTS "aiChatMessagesThisPeriod";
