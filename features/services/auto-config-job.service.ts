import { after } from 'next/server';

import { prisma } from '@/lib/prisma';
import { extractJson, sanitizeLlmError, type LlmErrorType } from '@/lib/llm-response';
import { validateExamBlueprint, type ParsedExamBlueprint } from '@/lib/exam-blueprint';
import { OpenAIService } from '@/features/services/openAI.service';
import { QuotaService } from '@/features/services/quota.service';
import { MetricsService } from '@/features/services/metrics.service';
import { AUTO_CONFIG_PROMPTS, editalLocatePrompt, examIdentifyPrompt } from '@/config/prompts';
import { fetchEditalPdf } from '@/lib/edital-fetch';
import { EditalExtractorService } from '@/features/services/edital-extractor.service';
import type { EditalCandidate, ExamType, LocateEditalResult } from '@/shared/types';

export type AutoConfigStage = 'research' | 'review' | 'format' | 'extract';
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
  readonly roles: readonly string[];
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
      roles: (() => {
        const raw = Array.isArray(m.roles) ? (m.roles as unknown[]) : [];
        const seen = new Set<string>();
        const normalized = raw
          .filter((r): r is string => typeof r === 'string' && r.trim() !== '')
          .map((r) => r.trim())
          .filter((r) => {
            const lower = r.toLowerCase();
            if (seen.has(lower)) return false;
            seen.add(lower);
            return true;
          })
          .slice(0, 12);
        const role = typeof m.role === 'string' && m.role.trim() ? m.role.trim() : null;
        if (role && !normalized.some((r) => r.toLowerCase() === role.toLowerCase())) {
          return [role, ...normalized];
        }
        return normalized;
      })(),
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
    // No jsonMode here: forcing json_object together with a forced tool_choice is a
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

function validateLocateResult(data: unknown): LocateEditalResult {
  if (!data || typeof data !== 'object') {
    throw Object.assign(new Error('Locate-edital response is not an object'), { status: 502 });
  }
  const payload = data as Record<string, unknown>;
  const rawEditais = Array.isArray(payload.editais) ? payload.editais : [];

  const editais: EditalCandidate[] = rawEditais
    .filter(
      (e): e is Record<string, unknown> =>
        !!e &&
        typeof e === 'object' &&
        typeof (e as Record<string, unknown>).url === 'string' &&
        /^https?:\/\//.test((e as Record<string, unknown>).url as string)
    )
    .slice(0, 5)
    .map((e) => ({
      url: (e.url as string).trim(),
      editalNumber: typeof e.editalNumber === 'string' && e.editalNumber.trim() ? e.editalNumber.trim() : null,
      year: typeof e.year === 'number' ? e.year : null,
      orgao: typeof e.orgao === 'string' && e.orgao.trim() ? e.orgao.trim() : null,
      isOfficialDomain: e.isOfficialDomain === true,
      coversRole: e.coversRole === true,
    }));

  return {
    editais,
    targetYearFound: payload.targetYearFound === true,
  };
}

export interface LocateEditalSeed {
  readonly examName: string;
  readonly examBoard: string | null;
  readonly editalKey: string | null;
  readonly year: number | null;
  readonly role: string;
  readonly language: 'pt' | 'en';
}

// Same rationale as identifyExam: a cheap pre-job call whose result (pick a prior-year
// edital, or proceed without one) is a user decision, so it never touches the persisted
// AutoConfigJob/quota-charging pipeline — createAutoConfigJob is still the single place
// that spends the auto_config unit.
export async function locateEdital(userId: string, seed: LocateEditalSeed): Promise<LocateEditalResult> {
  const openAIService = new OpenAIService();
  const metricsService = new MetricsService();

  const logId = await metricsService.createLog(userId, 'auto_config', 0);
  const t0 = Date.now();

  try {
    const result = await openAIService.call(
      editalLocatePrompt,
      {
        examName: seed.examName,
        examBoard: seed.examBoard,
        editalKey: seed.editalKey,
        year: seed.year,
        role: seed.role,
        language: seed.language,
      },
      { webSearch: true }
    );
    const durationMs = Date.now() - t0;
    void metricsService.recordStep(
      logId,
      'locate',
      { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      durationMs
    );
    await metricsService.finalize(logId, durationMs);

    return validateLocateResult(JSON.parse(extractJson(result.text)));
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
  // Set only for public_exam when locateEdital found a PDF and the user (implicitly, for the
  // target year, or explicitly, for a prior year) confirmed using it. Absent entirely when
  // locate failed, found nothing, or the user chose to proceed without it — runAutoConfigJob
  // falls back to the research/review/format text pipeline in that case.
  readonly edital?: { readonly url: string; readonly isPriorYear: boolean } | null;
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

  after(() => runAutoConfigJob(job.id, seed.language, seed.edital ?? null));

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
  // seedKey holds the edital number the identify step already resolved — passing it through
  // lets the research prompt search for that specific document instead of the exam by name
  // alone. language was previously dropped here even though the certification branch always
  // threads it — the public_exam research/review prompts are hardcoded PT-BR regardless, but
  // carrying it keeps the two branches symmetric for when that's addressed.
  return {
    public_exam_name: job.seedName,
    role: job.seedRole,
    exam_board_name: job.seedBoard,
    year: job.seedYear,
    key: job.seedKey,
    language,
  };
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

// One located PDF the caller has already resolved (target year or a user-picked prior year).
export interface JobEditalRef {
  readonly url: string;
  readonly isPriorYear: boolean;
}

// Attempts the PDF-grounded path for public_exam: download the edital and run it through the
// same extractor the manual-upload flow already uses. Returns null on any failure (bad URL,
// download refused, extraction error) so the caller falls back to the research/review/format
// text pipeline instead of failing the whole job over a single download.
async function tryEditalExtractBranch(
  jobId: string,
  job: { userId: string; seedRole: string | null; seedKey: string | null },
  edital: JobEditalRef,
  usageLogId: string,
  metricsService: MetricsService
): Promise<ParsedExamBlueprint | null> {
  const editalExtractorService = new EditalExtractorService();

  await setStage(jobId, 'extract');
  const t0 = Date.now();

  try {
    const file = await fetchEditalPdf(edital.url);
    const exam = await editalExtractorService.extract(job.userId, file, job.seedRole ?? undefined, {
      logId: usageLogId,
    });
    const editalLabel = job.seedKey ? `Edital nº ${job.seedKey}` : 'Edital oficial';

    return {
      examDraft: exam,
      context: edital.isPriorYear
        ? `Conteúdo extraído do edital de ${exam.year ?? 'um concurso anterior'}, usado como modelo — confira se o conteúdo programático do edital vigente é o mesmo antes de gerar questões.`
        : 'Conteúdo extraído diretamente do PDF do edital oficial.',
      sources: [`[${editalLabel}](${edital.url})`],
      confidence: edital.isPriorYear ? 'prior-year' : 'official',
    };
  } catch (err) {
    console.error(`[auto-config-job] Job "${jobId}" edital extraction failed, falling back to research:`, err);
    void metricsService.recordStep(usageLogId, 'extract', { inputTokens: 0, outputTokens: 0 }, Date.now() - t0);
    return null;
  }
}

// Runs the research → review → format chain, recording a UsageLogStep per stage under the
// job's single usageLogId and returning the resulting Exam blueprint.
async function runResearchReviewFormat(
  jobId: string,
  type: ExamType,
  job: Parameters<typeof buildResearchInput>[1] & Parameters<typeof buildReviewInput>[1],
  language: 'pt' | 'en',
  usageLogId: string,
  openAIService: OpenAIService,
  metricsService: MetricsService
): Promise<ParsedExamBlueprint> {
  const prompts = AUTO_CONFIG_PROMPTS[type];
  const reviewModel = process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o';

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

  const parsed = validateExamBlueprint(JSON.parse(extractJson(format.text)), type);

  // This branch never had the actual edital in front of it (that's the PDF branch's job) —
  // it's web research at best, a from-memory guess at worst. Mark it so the UI can say so.
  return type === 'public_exam' ? { ...parsed, confidence: 'estimated' } : parsed;
}

export async function runAutoConfigJob(
  jobId: string,
  language: 'pt' | 'en',
  edital?: JobEditalRef | null
): Promise<void> {
  const openAIService = new OpenAIService();
  const quotaService = new QuotaService();
  const metricsService = new MetricsService();

  const job = await prisma.autoConfigJob.findUnique({ where: { id: jobId } });
  if (!job || !job.usageLogId) return;

  const type = job.type as ExamType;
  const usageLogId = job.usageLogId;
  const startTime = Date.now();

  try {
    const parsed =
      type === 'public_exam' && edital?.url
        ? ((await tryEditalExtractBranch(jobId, job, edital, usageLogId, metricsService)) ??
          (await runResearchReviewFormat(jobId, type, job, language, usageLogId, openAIService, metricsService)))
        : await runResearchReviewFormat(jobId, type, job, language, usageLogId, openAIService, metricsService);

    if (type === 'public_exam' && job.seedRole) {
      Object.assign(parsed.examDraft, { role: job.seedRole });
    }

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
