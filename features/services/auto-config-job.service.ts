import { after } from 'next/server';

import { prisma } from '@/lib/prisma';
import { extractJson, sanitizeLlmError, type LlmErrorType } from '@/lib/llm-response';
import { validateExamBlueprint, type ParsedExamBlueprint } from '@/lib/exam-blueprint';
import { OpenAIService } from '@/features/services/openAI.service';
import { QuotaService } from '@/features/services/quota.service';
import { MetricsService } from '@/features/services/metrics.service';
import { AUTO_CONFIG_PROMPTS, examIdentifyPrompt } from '@/config/prompts';
import type { ExamType } from '@/shared/types';

export type AutoConfigStage = 'research' | 'review' | 'format';
export type AutoConfigErrorType = LlmErrorType;

function sanitizeAutoConfigError(err: unknown): { message: string; errorType: AutoConfigErrorType } {
  return sanitizeLlmError(err, {
    internal: 'Erro interno ao configurar o exame',
    generic: 'Erro na configuração automática do exame',
  });
}

export interface IdentifyMatch {
  readonly label: string;
  readonly key: string | null;
  readonly provider: string | null;
  readonly examBoard: string | null;
  readonly role: string | null;
  readonly year: number | null;
}

export interface IdentifyResult {
  readonly matches: readonly IdentifyMatch[];
  readonly clarification: string | null;
}

function validateIdentifyResult(data: unknown): IdentifyResult {
  if (!data || typeof data !== 'object') {
    throw Object.assign(new Error('Identify response is not an object'), { status: 502 });
  }
  const payload = data as Record<string, unknown>;
  const rawMatches = Array.isArray(payload.matches) ? payload.matches : [];

  const matches: IdentifyMatch[] = rawMatches
    .filter(
      (m): m is Record<string, unknown> =>
        !!m &&
        typeof m === 'object' &&
        typeof (m as Record<string, unknown>).label === 'string' &&
        ((m as Record<string, unknown>).label as string).trim() !== ''
    )
    .slice(0, 5)
    .map((m) => ({
      label: (m.label as string).trim(),
      key: typeof m.key === 'string' && m.key.trim() ? m.key.trim() : null,
      provider: typeof m.provider === 'string' && m.provider.trim() ? m.provider.trim() : null,
      examBoard: typeof m.examBoard === 'string' && m.examBoard.trim() ? m.examBoard.trim() : null,
      role: typeof m.role === 'string' && m.role.trim() ? m.role.trim() : null,
      year: typeof m.year === 'number' ? m.year : null,
    }));

  return {
    matches,
    clarification:
      typeof payload.clarification === 'string' && payload.clarification.trim() ? payload.clarification.trim() : null,
  };
}

// Short, cheap call that runs before any job exists — its result is a user decision (pick
// a match), so it stays outside the persisted job/SSE pipeline. Tokens are tracked via a
// `count: 0` UsageLog (see MetricsService.createLog) so they show up in cost analytics
// without consuming an auto_config unit; the unit is spent once, when the job is created.
export async function identifyExam(
  userId: string,
  query: string,
  type: ExamType,
  language: 'pt' | 'en'
): Promise<IdentifyResult> {
  const openAIService = new OpenAIService();
  const metricsService = new MetricsService();

  const logId = await metricsService.createLog(userId, 'auto_config', 0);
  const t0 = Date.now();

  try {
    // No jsonMode here: web_search_preview + a forced json_object response format is a
    // combination no other call site in this codebase relies on (research steps always
    // stay plain-text; jsonMode-only calls never set webSearch). The prompt already asks
    // for JSON-only output, and extractJson() below tolerates surrounding prose or fences.
    const result = await openAIService.call(examIdentifyPrompt, { query, type, language }, { webSearch: true });
    const durationMs = Date.now() - t0;
    void metricsService.recordStep(
      logId,
      'identify',
      { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      durationMs
    );
    await metricsService.finalize(logId, durationMs);

    return validateIdentifyResult(JSON.parse(extractJson(result.text)));
  } catch (err) {
    await metricsService.finalize(logId, Date.now() - t0);
    throw err;
  }
}

export interface AutoConfigSeed {
  readonly type: ExamType;
  readonly name: string;
  readonly key?: string | null;
  readonly provider?: string | null;
  readonly examBoard?: string | null;
  readonly role?: string | null;
  readonly year?: number | null;
  readonly language: 'pt' | 'en';
}

// Creates the persisted job and charges the single auto_config unit for the whole
// pipeline, then hands off to runAutoConfigJob via after() — the route returns the
// jobId immediately and the frontend follows progress over SSE.
export async function createAutoConfigJob(userId: string, seed: AutoConfigSeed): Promise<{ jobId: string }> {
  const quotaService = new QuotaService();

  const existing = await prisma.autoConfigJob.findFirst({
    where: { userId, status: { in: ['queued', 'running'] } },
    select: { id: true },
  });
  if (existing) {
    throw Object.assign(new Error('An auto-config job is already in progress'), { status: 409 });
  }

  const { logId } = await quotaService.checkAndRecordAutoConfig(userId);

  const job = await prisma.autoConfigJob.create({
    data: {
      userId,
      type: seed.type,
      seedName: seed.name,
      seedKey: seed.key ?? null,
      seedProvider: seed.provider ?? null,
      seedBoard: seed.examBoard ?? null,
      seedRole: seed.role ?? null,
      seedYear: seed.year ?? null,
      usageLogId: logId,
    },
  });

  after(() => runAutoConfigJob(job.id, seed.language));

  return { jobId: job.id };
}

async function setStage(jobId: string, stage: AutoConfigStage): Promise<void> {
  await prisma.autoConfigJob.update({ where: { id: jobId }, data: { stage, status: 'running' } });
}

function buildResearchInput(
  type: ExamType,
  job: {
    seedName: string;
    seedProvider: string | null;
    seedKey: string | null;
    seedBoard: string | null;
    seedRole: string | null;
    seedYear: number | null;
  },
  language: 'pt' | 'en'
): Record<string, unknown> {
  if (type === 'certification') {
    return { certification_name: job.seedName, provider: job.seedProvider, key: job.seedKey, language };
  }
  return { public_exam_name: job.seedName, role: job.seedRole, exam_board_name: job.seedBoard, year: job.seedYear };
}

function buildReviewInput(
  type: ExamType,
  job: { seedName: string; seedBoard: string | null; seedRole: string | null },
  draftBlueprint: string,
  language: 'pt' | 'en'
): Record<string, unknown> {
  if (type === 'certification') {
    return { certification_name: job.seedName, draft_blueprint: draftBlueprint, language };
  }
  return {
    public_exam_name: job.seedName,
    role: job.seedRole,
    exam_board_name: job.seedBoard,
    draft_blueprint: draftBlueprint,
  };
}

function buildFormatInput(
  type: ExamType,
  job: { seedName: string },
  reviewedBlueprint: string
): Record<string, unknown> {
  if (type === 'certification') {
    return { certification_name: job.seedName, reviewed_blueprint: reviewedBlueprint };
  }
  return { public_exam_name: job.seedName, reviewed_blueprint: reviewedBlueprint };
}

// Runs the research → review → format chain for one job, recording a UsageLogStep per
// stage under the job's single usageLogId and persisting the resulting Exam blueprint.
export async function runAutoConfigJob(jobId: string, language: 'pt' | 'en'): Promise<void> {
  const openAIService = new OpenAIService();
  const quotaService = new QuotaService();
  const metricsService = new MetricsService();

  const job = await prisma.autoConfigJob.findUnique({ where: { id: jobId } });
  if (!job || !job.usageLogId) return;

  const type = job.type as ExamType;
  const prompts = AUTO_CONFIG_PROMPTS[type];
  const reviewModel = process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o';
  const usageLogId = job.usageLogId;
  const startTime = Date.now();

  try {
    await setStage(jobId, 'research');
    let t0 = Date.now();
    const research = await openAIService.call(prompts.research, buildResearchInput(type, job, language), {
      webSearch: true,
    });
    void metricsService.recordStep(
      usageLogId,
      'config_research',
      { inputTokens: research.inputTokens, outputTokens: research.outputTokens },
      Date.now() - t0
    );

    await setStage(jobId, 'review');
    t0 = Date.now();
    const review = await openAIService.call(prompts.review, buildReviewInput(type, job, research.text, language), {
      webSearch: false,
      model: reviewModel,
    });
    void metricsService.recordStep(
      usageLogId,
      'config_review',
      { inputTokens: review.inputTokens, outputTokens: review.outputTokens },
      Date.now() - t0
    );

    await setStage(jobId, 'format');
    t0 = Date.now();
    const format = await openAIService.call(prompts.format, buildFormatInput(type, job, review.text), {
      webSearch: false,
      jsonMode: true,
    });
    void metricsService.recordStep(
      usageLogId,
      'config_format',
      { inputTokens: format.inputTokens, outputTokens: format.outputTokens },
      Date.now() - t0
    );

    const parsed: ParsedExamBlueprint = validateExamBlueprint(JSON.parse(extractJson(format.text)), type);

    await metricsService.finalize(usageLogId, Date.now() - startTime);

    // A cancel that landed while the last stage was in flight already rolled back the
    // quota and marked the job — don't clobber that with a late 'done'.
    if (await wasCancelled(jobId)) return;

    await prisma.autoConfigJob.update({
      where: { id: jobId },
      data: { status: 'done', stage: null, resultJson: JSON.stringify(parsed) },
    });
  } catch (err) {
    // Same race as above, the other direction: a cancel already rolled back the quota
    // and marked the job — don't clobber 'cancelled' with a late 'error'.
    if (await wasCancelled(jobId)) return;

    console.error(`[auto-config-job] Job "${jobId}" failed:`, err);
    const { message, errorType } = sanitizeAutoConfigError(err);

    try {
      await quotaService.rollbackQuota(usageLogId);
    } catch (rbErr) {
      console.error('[auto-config-job] rollbackQuota failed:', rbErr);
    }

    await prisma.autoConfigJob.update({
      where: { id: jobId },
      data: { status: 'error', errorMessage: message, errorType },
    });
  }
}

async function wasCancelled(jobId: string): Promise<boolean> {
  const current = await prisma.autoConfigJob.findUnique({ where: { id: jobId }, select: { status: true } });

  return current?.status === 'cancelled';
}

// Best-effort cancel: the in-flight LLM call isn't aborted (same limitation as
// generation-job's DELETE), but the job is marked cancelled and its quota unit refunded
// immediately rather than waiting for whichever stage is currently running to finish.
export async function cancelAutoConfigJob(jobId: string, userId: string): Promise<void> {
  const job = await prisma.autoConfigJob.findFirst({ where: { id: jobId, userId } });
  if (!job) {
    throw Object.assign(new Error('Job not found'), { status: 404 });
  }
  if (job.status !== 'queued' && job.status !== 'running') {
    throw Object.assign(new Error('Job cannot be cancelled'), { status: 409 });
  }

  const quotaService = new QuotaService();
  if (job.usageLogId) {
    try {
      await quotaService.rollbackQuota(job.usageLogId);
    } catch (err) {
      console.error('[auto-config-job] rollbackQuota on cancel failed:', err);
    }
  }

  await prisma.autoConfigJob.update({
    where: { id: jobId },
    data: { status: 'cancelled', stage: null },
  });
}

export async function getActiveAutoConfigJob(userId: string, type: ExamType) {
  return prisma.autoConfigJob.findFirst({
    where: { userId, type, status: { in: ['queued', 'running'] } },
    orderBy: { createdAt: 'desc' },
  });
}
