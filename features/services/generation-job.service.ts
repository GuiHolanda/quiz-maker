import { after } from 'next/server';

import { prisma } from '@/lib/prisma';
import { shuffleOptionTexts } from '@/lib/shuffle-options';
import { extractJson, sanitizeLlmError, type LlmErrorType } from '@/lib/llm-response';
import { resolveQuestionFormat } from '@/config/question-formats';
import type { QuestionFormat } from '@/config/question-formats';
import { OpenAIService } from '@/features/services/openAI.service';
import { QuotaService } from '@/features/services/quota.service';
import { MetricsService } from '@/features/services/metrics.service';
import { ReferralService } from '@/features/services/referral.service';
import { sanitizeAiQuestions } from '@/features/services/exam-question.service';
import { EXAM_PROMPTS } from '@/config/prompts';
import {
  GENERATION_MAX_CONCURRENT_TOPICS,
  GENERATION_MAX_TOPICS_PER_USER,
  GENERATION_MAX_PROMPT_TOPICS,
} from '@/config/constants';
import type { AIExamQuestion } from '@/shared/types';

export { extractJson };

export type TopicErrorType = LlmErrorType;

export function sanitizeError(err: unknown): { message: string; errorType: TopicErrorType } {
  return sanitizeLlmError(err, { internal: 'Erro interno ao gerar questões', generic: 'Erro na geração de questões' });
}

// Promove tópicos "queued" para "running" respeitando os tetos global e por usuário.
// Roda numa transação para que invocações concorrentes de after() não ultrapassem os limites.
// Retorna os IDs dos tópicos promovidos.
export async function claimSlots(userId: string): Promise<string[]> {
  return prisma.$transaction(async (tx) => {
    const globalRunning = await tx.generationJobTopic.count({ where: { status: 'running' } });
    const userRunning = await tx.generationJobTopic.count({
      where: { status: 'running', job: { userId } },
    });

    const slots = Math.min(
      GENERATION_MAX_CONCURRENT_TOPICS - globalRunning,
      GENERATION_MAX_TOPICS_PER_USER - userRunning
    );
    if (slots <= 0) return [];

    const candidates = await tx.generationJobTopic.findMany({
      where: { status: 'queued', job: { userId } },
      orderBy: { createdAt: 'asc' },
      take: slots,
      select: { id: true, jobId: true },
    });
    if (candidates.length === 0) return [];

    const ids = candidates.map((c) => c.id);
    await tx.generationJobTopic.updateMany({
      where: { id: { in: ids } },
      data: { status: 'running' },
    });

    // Promove o job de "queued" para "running" quando o primeiro tópico inicia.
    const jobIds = Array.from(new Set(candidates.map((c) => c.jobId)));
    await tx.generationJob.updateMany({
      where: { id: { in: jobIds }, status: 'queued' },
      data: { status: 'running' },
    });

    return ids;
  });
}

// Promove tópicos "queued" de qualquer usuário quando ainda há folga no teto global.
// Usado para aproveitar slots livres para jobs de outros usuários na fila.
async function claimGlobalSlots(): Promise<string[]> {
  return prisma.$transaction(async (tx) => {
    const globalRunning = await tx.generationJobTopic.count({ where: { status: 'running' } });
    const slots = GENERATION_MAX_CONCURRENT_TOPICS - globalRunning;
    if (slots <= 0) return [];

    // Agrupa candidatos por usuário para respeitar o teto por usuário na promoção global.
    const candidates = await tx.generationJobTopic.findMany({
      where: { status: 'queued' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, jobId: true, job: { select: { userId: true } } },
      take: slots * 4,
    });
    if (candidates.length === 0) return [];

    // Conta os tópicos "running" por usuário com uma única agregação, em vez de N counts
    // dentro da transação (evita serializar dezenas de queries sob o lock de escrita).
    const runningTopics = await tx.generationJobTopic.findMany({
      where: { status: 'running' },
      select: { job: { select: { userId: true } } },
    });
    const userRunningCounts = new Map<string, number>();
    for (const runningTopic of runningTopics) {
      const runningUserId = runningTopic.job.userId;
      userRunningCounts.set(runningUserId, (userRunningCounts.get(runningUserId) ?? 0) + 1);
    }

    const toPromote: string[] = [];
    const jobIds = new Set<string>();
    for (const candidate of candidates) {
      if (toPromote.length >= slots) break;
      const userId = candidate.job.userId;
      const running = userRunningCounts.get(userId) ?? 0;
      if (running >= GENERATION_MAX_TOPICS_PER_USER) continue;
      toPromote.push(candidate.id);
      jobIds.add(candidate.jobId);
      userRunningCounts.set(userId, running + 1);
    }
    if (toPromote.length === 0) return [];

    await tx.generationJobTopic.updateMany({
      where: { id: { in: toPromote } },
      data: { status: 'running' },
    });
    await tx.generationJob.updateMany({
      where: { id: { in: Array.from(jobIds) }, status: 'queued' },
      data: { status: 'running' },
    });

    return toPromote;
  });
}

// Após um tópico terminar, tenta promover os próximos: primeiro do mesmo usuário,
// depois de outros usuários se ainda houver slot global livre. Dispara cada tópico promovido.
async function releaseAndClaimNext(userId: string): Promise<void> {
  try {
    const own = await claimSlots(userId);
    for (const id of own) after(() => processTopic(id));

    const others = await claimGlobalSlots();
    for (const id of others) after(() => processTopic(id));
  } catch (err) {
    console.error('[generation-job] releaseAndClaimNext failed:', err);
  }
}

// Libera slots globais e dispara os tópicos promovidos. Usado ao cancelar um job
// (DELETE) ou na limpeza de jobs travados, para destravar a fila global.
export async function claimGlobalSlotsAndDispatch(): Promise<void> {
  try {
    const promoted = await claimGlobalSlots();
    for (const id of promoted) after(() => processTopic(id));
  } catch (err) {
    console.error('[generation-job] claimGlobalSlotsAndDispatch failed:', err);
  }
}

// Marca o job como "awaiting_review" quando todos os tópicos terminaram (done/error/cancelled).
// Sempre atualiza updatedAt para que o cron de cleanup não mate jobs grandes ainda em progresso.
async function maybeFinalizeJob(jobId: string): Promise<void> {
  const pending = await prisma.generationJobTopic.count({
    where: { jobId, status: { in: ['queued', 'running'] } },
  });
  if (pending === 0) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: 'awaiting_review' },
    });
  } else {
    // Heartbeat: cada tópico concluído renova o TTL do job para o cron não o considerar travado.
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { updatedAt: new Date() },
    });
  }
}

// Processa um único tópico: roda o pipeline de 3 etapas e persiste as questões geradas
// em pendingQuestionsJson. Ao terminar (sucesso ou erro), libera o slot e puxa o próximo.
export async function processTopic(topicId: string): Promise<void> {
  const openAIService = new OpenAIService();
  const quotaService = new QuotaService();
  const metricsService = new MetricsService();
  const referralService = new ReferralService();

  const topic = await prisma.generationJobTopic.findUnique({
    where: { id: topicId },
    include: { job: true },
  });
  if (!topic || !topic.job) return;

  const { job } = topic;
  const { userId, type, refName, examBoardName } = job;

  // One lookup serves both the pool query and the prompts: the exam declares the
  // question shape every step of the pipeline must produce.
  const exam = await prisma.exam.findFirst({
    where: { id: job.refKey },
    select: { providerId: true, examBoardId: true, questionFormat: true },
  });
  const examFormat = resolveQuestionFormat(exam?.questionFormat);

  // Fetch the sub-topics for this section so they can be included in the prompts.
  const sectionTopics = await prisma.examSection
    .findFirst({
      where: { examId: job.refKey, name: topic.topicName },
      select: { topics: { select: { name: true }, orderBy: { id: 'asc' } } },
    })
    .then((s) => s?.topics ?? []);

  let promptTopics = sectionTopics;
  if (sectionTopics.length > GENERATION_MAX_PROMPT_TOPICS) {
    // Fisher-Yates shuffle then take the first N — avoids always picking the same slice.
    const shuffled = [...sectionTopics];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    promptTopics = shuffled.slice(0, GENERATION_MAX_PROMPT_TOPICS);
  }

  const topicsList =
    promptTopics.length > 0 ? promptTopics.map((t: { name: string }) => `- ${t.name}`).join('\n') : undefined;

  let logId: string | null = null;

  try {
    const startTime = Date.now();
    // Quota is recorded for the full requested count regardless of whether questions
    // come from the pool or the LLM — recycled questions still consume quota.
    const recorded = await quotaService.checkAndRecordQuestions(userId, topic.questionCount, {
      refKey: job.refKey,
      refName: job.refName,
      type: job.type,
      topicName: topic.topicName,
    });
    logId = recorded.logId;

    // First generated batch is one of the two referral activation triggers (the other is
    // finishing a mock exam) — never let this side effect fail the generation itself.
    try {
      await referralService.activateIfEligible(userId);
    } catch (err) {
      console.error('Failed to process referral activation:', err);
    }

    // Check whether the pool has questions this user hasn't seen yet for this context.
    // Serve from pool first; only call LLM for any remaining shortfall.
    const poolResult = await tryServeFromPool(
      userId,
      job.type as 'certification' | 'public_exam',
      job.refKey,
      exam,
      examFormat,
      topic.topicName,
      topic.questionCount
    );

    if (poolResult.served === topic.questionCount) {
      await metricsService.finalize(logId, Date.now() - startTime);
      await prisma.generationJobTopic.update({
        where: { id: topicId },
        data: { status: 'done', savedCount: 0, pendingQuestionsJson: null },
      });
      await maybeFinalizeJob(job.id);
      await releaseAndClaimNext(userId);
      return;
    }

    const remainingCount = topic.questionCount - poolResult.served;
    const numStr = String(remainingCount);

    let questions: AIExamQuestion[];

    const prompts = EXAM_PROMPTS[type as 'certification' | 'public_exam'];
    const reviewModel = process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o';

    // Build the per-type input for each of the three pipeline steps. The prompt
    // objects come from the type-keyed dispatch table; the input shapes differ
    // (certification vs concurso), so they are constructed per branch.
    // Every step carries the format: research writes the options, review must not
    // reshape them, and format emits the JSON skeleton for that same label set.
    const buildInput = (step: 'research' | 'review' | 'format', priorText?: string): Record<string, unknown> => {
      const format = examFormat.key;

      if (type === 'certification') {
        if (step === 'research')
          return {
            certification_name: refName,
            topic_name: topic.topicName,
            num_questions: numStr,
            topics_list: topicsList,
            format,
          };
        if (step === 'review')
          return {
            certification_name: refName,
            topic_name: topic.topicName,
            draft_questions: priorText,
            topics_list: topicsList,
            format,
          };
        return { certification_name: refName, topic_name: topic.topicName, reviewed_questions: priorText, format };
      }
      if (step === 'research') {
        return {
          public_exam_name: refName,
          exam_board_name: examBoardName ?? '',
          subject_name: topic.topicName,
          num_questions: numStr,
          topics_list: topicsList,
          format,
        };
      }
      if (step === 'review') {
        return {
          public_exam_name: refName,
          exam_board_name: examBoardName ?? '',
          subject_name: topic.topicName,
          draft_questions: priorText,
          topics_list: topicsList,
          format,
        };
      }
      return {
        public_exam_name: refName,
        exam_board_name: examBoardName ?? '',
        subject_name: topic.topicName,
        reviewed_questions: priorText,
        format,
      };
    };

    let t0 = Date.now();
    const research = await openAIService.call(prompts.research, buildInput('research'), { webSearch: true });
    void metricsService.recordStep(
      logId,
      'research',
      { inputTokens: research.inputTokens, outputTokens: research.outputTokens },
      Date.now() - t0
    );

    t0 = Date.now();
    const review = await openAIService.call(prompts.review, buildInput('review', research.text), {
      webSearch: false,
      model: reviewModel,
    });
    void metricsService.recordStep(
      logId,
      'review',
      { inputTokens: review.inputTokens, outputTokens: review.outputTokens },
      Date.now() - t0
    );

    t0 = Date.now();
    const format = await openAIService.call(prompts.format, buildInput('format', review.text), {
      webSearch: false,
      jsonMode: true,
    });
    void metricsService.recordStep(
      logId,
      'format',
      { inputTokens: format.inputTokens, outputTokens: format.outputTokens },
      Date.now() - t0
    );

    const { questions: validQuestions, dropped } = sanitizeAiQuestions(
      JSON.parse(extractJson(format.text)),
      examFormat
    );

    if (dropped.length > 0) {
      console.warn(
        `[generation-job] Topic "${topic.topicName}": descartadas ${dropped.length} questão(ões) malformada(s) — ${dropped.join('; ')}`
      );
    }

    if (validQuestions.length === 0) {
      throw new Error(`Invalid format: a geração não produziu nenhuma questão válida (${dropped.length} descartadas)`);
    }

    questions = validQuestions;

    // Defense: the review step may return more questions than requested despite prompt constraints.
    // Truncate to the requested count so saved count never exceeds what was charged to quota.
    if (questions.length > remainingCount) {
      questions = questions.slice(0, remainingCount);
    }

    await metricsService.finalize(logId, Date.now() - startTime);

    await prisma.generationJobTopic.update({
      where: { id: topicId },
      data: { status: 'done', savedCount: 0, pendingQuestionsJson: JSON.stringify(questions) },
    });
  } catch (topicErr) {
    console.error(`[generation-job] Topic "${topic.topicName}" failed:`, topicErr);
    const { message, errorType } = sanitizeError(topicErr);
    // Só há o que reembolsar se a quota chegou a ser debitada (logId definido).
    if (logId) {
      try {
        await quotaService.rollbackQuota(logId);
      } catch (rbErr) {
        console.error('[generation-job] rollbackQuota failed:', rbErr);
      }
    }
    await prisma.generationJobTopic.update({
      where: { id: topicId },
      data: { status: 'error', errorMessage: message, errorType },
    });
  } finally {
    try {
      await maybeFinalizeJob(job.id);
    } catch (e) {
      console.error('[generation-job] maybeFinalizeJob failed:', e);
    }
    try {
      await releaseAndClaimNext(userId);
    } catch (e) {
      console.error('[generation-job] releaseAndClaimNext failed:', e);
    }
  }
}

interface PoolServeResult {
  served: number;
}

async function tryServeFromPool(
  userId: string,
  type: 'certification' | 'public_exam',
  examId: string,
  exam: { providerId: string | null; examBoardId: string | null } | null,
  format: QuestionFormat,
  sectionName: string,
  requested: number
): Promise<PoolServeResult> {
  if (!exam || (!exam.providerId && !exam.examBoardId)) {
    return { served: 0 };
  }

  const pools = await prisma.questionPool.findMany({
    where: {
      type,
      providerId: exam.providerId ?? null,
      examBoardId: exam.examBoardId ?? null,
      sectionName,
    },
  });

  if (pools.length === 0) return { served: 0 };

  const poolIds = pools.map((p) => p.id);

  // Find pooled questions this user has NOT yet received across all pools for the section.
  const alreadyHas = await prisma.examQuestion.findMany({
    where: { poolId: { in: poolIds }, userId },
    select: { id: true },
  });
  const alreadyHasIds = alreadyHas.map((q) => q.id);

  // The pool key is (type, provider, examBoard, section, topic) — format is NOT part of
  // it, so one pool holds questions of every shape the provider has ever produced.
  // Without this filter a 4-option exam would be served 5-option questions.
  const candidates = await prisma.examQuestion.findMany({
    where: { poolId: { in: poolIds }, id: { notIn: alreadyHasIds }, format: format.key },
    include: { options: true },
    take: requested,
  });

  if (candidates.length === 0) return { served: 0 };

  // Create ExamQuestion copies for this user, linked to the user's exam and original pool.
  for (const src of candidates) {
    // Each copy gets its own letter assignment: the pool row carries the ordering the
    // drafting LLM chose, and the copy has no answer yet, so shuffling here is safe and
    // decorrelates the gabarito letter between users served the same pooled question.
    // Semantic labels (Certo/Errado) are exempt — there the label is the meaning.
    const sourceOptions = Object.fromEntries(src.options.map((option) => [option.label, option.text]));
    const copyOptions = format.labelsAreSemantic ? sourceOptions : shuffleOptionTexts(sourceOptions);

    await prisma.examQuestion.create({
      data: {
        text: src.text,
        correctCount: src.correctCount,
        difficulty: src.difficulty,
        format: src.format,
        examName: src.examName,
        sectionName: src.sectionName,
        topicName: src.topicName,
        userId,
        examId,
        sectionId: src.sectionId,
        topicId: src.topicId,
        poolId: src.poolId,
        options: { create: Object.entries(copyOptions).map(([label, text]) => ({ label, text })) },
      },
    });
  }

  return { served: candidates.length };
}
