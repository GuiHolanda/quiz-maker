import { after } from 'next/server';

import { prisma } from '@/lib/prisma';
import { OpenAIService } from '@/features/services/openAI.service';
import { QuotaService } from '@/features/services/quota.service';
import { validateAiQuestions } from '@/features/services/question.service';
import { certificationQuestionsResearchPrompt } from '@/config/prompts/certification-questions-research.prompt';
import { certificationQuestionsReviewPrompt } from '@/config/prompts/certification-questions-review.prompt';
import { certificationQuestionsFormatPrompt } from '@/config/prompts/certification-questions-format.prompt';
import { publicExamQuestionsResearchPrompt } from '@/config/prompts/public-exam-questions-research.prompt';
import { publicExamQuestionsReviewPrompt } from '@/config/prompts/public-exam-questions-review.prompt';
import { publicExamQuestionsFormatPrompt } from '@/config/prompts/public-exam-questions-format.prompt';
import { GENERATION_MAX_CONCURRENT_TOPICS, GENERATION_MAX_TOPICS_PER_USER } from '@/config/constants';
import type { AIQuestion, AIPublicExamQuestion } from '@/shared/types';

export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export type TopicErrorType = 'quota' | 'generation' | 'timeout';

export function sanitizeError(err: unknown): { message: string; errorType: TopicErrorType } {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // 429 vem primeiro: um "insufficient_quota" da OpenAI tem status 429 e a palavra "quota"
    // na mensagem, mas é limite da plataforma, não do usuário — não deve virar errorType 'quota'.
    if ((err as { status?: number }).status === 429) {
      return { message: 'Limite de requisições da IA atingido', errorType: 'timeout' };
    }
    if (msg.includes('limit reached') || msg.includes('quota')) {
      return { message: 'Limite de quota atingido', errorType: 'quota' };
    }
    if (msg.includes('timeout') || msg.includes('econnaborted')) {
      return { message: 'Tempo limite de geração excedido', errorType: 'timeout' };
    }
    if ('code' in err) {
      return { message: 'Erro interno ao gerar questões', errorType: 'generation' };
    }
  }
  return { message: 'Erro na geração de questões', errorType: 'generation' };
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

  const topic = await prisma.generationJobTopic.findUnique({
    where: { id: topicId },
    include: { job: true },
  });
  if (!topic || !topic.job) return;

  const { job } = topic;
  const { userId, type, refName, examBoardName } = job;

  let logId: string | null = null;

  try {
    const numStr = String(topic.questionCount);
    const recorded = await quotaService.checkAndRecordQuestions(userId, topic.questionCount);
    logId = recorded.logId;

    let questions: AIQuestion[] | AIPublicExamQuestion[];

    if (type === 'certification') {
      const research = await openAIService.call(
        certificationQuestionsResearchPrompt,
        { certification_name: refName, topic_name: topic.topicName, num_questions: numStr },
        { webSearch: true }
      );
      const review = await openAIService.call(
        certificationQuestionsReviewPrompt,
        { certification_name: refName, topic_name: topic.topicName, draft_questions: research.text },
        { webSearch: false, model: process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o' }
      );
      const format = await openAIService.call(
        certificationQuestionsFormatPrompt,
        { certification_name: refName, topic_name: topic.topicName, reviewed_questions: review.text },
        { webSearch: false, jsonMode: true }
      );
      questions = validateAiQuestions(JSON.parse(extractJson(format.text))) as AIQuestion[];
    } else {
      const research = await openAIService.call(
        publicExamQuestionsResearchPrompt,
        {
          public_exam_name: refName,
          exam_board_name: examBoardName ?? '',
          subject_name: topic.topicName,
          num_questions: numStr,
        },
        { webSearch: true }
      );
      const review = await openAIService.call(
        publicExamQuestionsReviewPrompt,
        {
          public_exam_name: refName,
          exam_board_name: examBoardName ?? '',
          subject_name: topic.topicName,
          draft_questions: research.text,
        },
        { webSearch: false, model: process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o' }
      );
      const format = await openAIService.call(
        publicExamQuestionsFormatPrompt,
        {
          public_exam_name: refName,
          exam_board_name: examBoardName ?? '',
          subject_name: topic.topicName,
          reviewed_questions: review.text,
        },
        { webSearch: false, jsonMode: true }
      );
      questions = validateAiQuestions(JSON.parse(extractJson(format.text))) as AIPublicExamQuestion[];
    }

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
