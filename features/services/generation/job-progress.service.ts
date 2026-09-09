import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, isRedisConfigured } from '@/lib/redis';

// O TTL é a janela máxima de defasagem no único caminho ruim: uma transição cujo publish
// falhou no Redis. No caminho feliz não há defasagem — o escritor publica a cada mudança
// de estado. Expirar sozinho garante que o stream se corrige mesmo assim.
export const JOB_SNAPSHOT_TTL_SECONDS = 30;

export interface GenerationTopicSnapshot {
  id: string;
  topicName: string;
  questionCount: number;
  status: string;
  savedCount: number;
  errorMessage: string | null;
  errorType: string | null;
}

export interface GenerationJobSnapshot {
  status: string;
  savedCount: number;
  topics: GenerationTopicSnapshot[];
}

export interface AutoConfigJobSnapshot {
  status: string;
  stage: string | null;
  errorMessage: string | null;
  errorType: string | null;
  resultJson: string | null;
}

function generationKey(jobId: string): string {
  return `job:generation:${jobId}`;
}

function autoConfigKey(jobId: string): string {
  return `job:auto-config:${jobId}`;
}

async function loadGenerationFromDb(jobId: string): Promise<GenerationJobSnapshot | null> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      savedCount: true,
      topics: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          topicName: true,
          questionCount: true,
          status: true,
          savedCount: true,
          errorMessage: true,
          errorType: true,
        },
      },
    },
  });

  return job ? { status: job.status, savedCount: job.savedCount, topics: job.topics } : null;
}

async function loadAutoConfigFromDb(jobId: string): Promise<AutoConfigJobSnapshot | null> {
  const job = await prisma.autoConfigJob.findUnique({
    where: { id: jobId },
    select: { status: true, stage: true, errorMessage: true, errorType: true, resultJson: true },
  });

  return job ?? null;
}

export async function readGenerationProgress(jobId: string): Promise<GenerationJobSnapshot | null> {
  const cached = await cacheGet<GenerationJobSnapshot>(generationKey(jobId));

  if (cached) return cached;

  const fresh = await loadGenerationFromDb(jobId);

  if (fresh) await cacheSet(generationKey(jobId), fresh, JOB_SNAPSHOT_TTL_SECONDS);

  return fresh;
}

export async function readAutoConfigProgress(jobId: string): Promise<AutoConfigJobSnapshot | null> {
  const cached = await cacheGet<AutoConfigJobSnapshot>(autoConfigKey(jobId));

  if (cached) return cached;

  const fresh = await loadAutoConfigFromDb(jobId);

  if (fresh) await cacheSet(autoConfigKey(jobId), fresh, JOB_SNAPSHOT_TTL_SECONDS);

  return fresh;
}

// Sem Redis não há para onde publicar, e a leitura extra no Postgres seria puro desperdício
// — por isso a guarda vem antes da query, e não depois.
export async function publishGenerationProgress(jobId: string): Promise<void> {
  if (!isRedisConfigured()) return;

  const snapshot = await loadGenerationFromDb(jobId);

  if (snapshot) await cacheSet(generationKey(jobId), snapshot, JOB_SNAPSHOT_TTL_SECONDS);
}

export async function publishAutoConfigProgress(jobId: string): Promise<void> {
  if (!isRedisConfigured()) return;

  const snapshot = await loadAutoConfigFromDb(jobId);

  if (snapshot) await cacheSet(autoConfigKey(jobId), snapshot, JOB_SNAPSHOT_TTL_SECONDS);
}
