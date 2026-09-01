-- Migration: add_generation_job_language
-- Seletor de idioma na geracao de questoes: GenerationJob.language guarda o
-- idioma-alvo escolhido ("pt" | "en"). Concurso e sempre "pt"; o valor so varia
-- para certificacao. O processTopic le esse campo e injeta o idioma em cada
-- passo do pipeline de prompts.
--
-- Idempotente: IF NOT EXISTS na coluna nova, com default para as linhas existentes.

ALTER TABLE "GenerationJob" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'pt';
