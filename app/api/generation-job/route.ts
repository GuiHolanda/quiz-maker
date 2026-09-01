import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import { claimSlots, processTopic } from '@/features/services/generation-job.service';
import { QuotaService } from '@/features/services/quota.service';
import { isGenerationLanguage, resolveGenerationLanguage } from '@/config/generation-languages';
import {
  GENERATION_MAX_TOPICS_PER_JOB,
  GENERATION_MAX_QUESTIONS_PER_TOPIC,
  GENERATION_MAX_ACTIVE_JOBS_PER_USER,
} from '@/config/constants';

export const maxDuration = 300;

type JobWithTopics = Awaited<ReturnType<typeof prisma.generationJob.findFirst>> & {
  topics?: {
    id: string;
    topicName: string;
    questionCount: number;
    status: string;
    savedCount: number;
    errorMessage: string | null;
    errorType: string | null;
  }[];
};

function shapeJob(job: JobWithTopics) {
  if (!job) return null;
  const topics = job.topics ?? [];
  const doneTopics = topics.filter((t) => t.status === 'done' || t.status === 'error').length;
  const queuedTopics = topics.filter((t) => t.status === 'queued').length;
  return {
    id: job.id,
    status: job.status,
    totalTopics: topics.length,
    doneTopics,
    queuedTopics,
    savedCount: job.savedCount,
    type: job.type,
    refKey: job.refKey,
    refName: job.refName,
    examBoardName: job.examBoardName,
    topics: topics.map((t) => ({
      id: t.id,
      topicName: t.topicName,
      questionCount: t.questionCount,
      status: t.status,
      savedCount: t.savedCount,
      errorMessage: t.errorMessage,
      errorType: t.errorType,
    })),
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      type?: unknown;
      refKey?: unknown;
      refName?: unknown;
      examBoardName?: unknown;
      language?: unknown;
      distribution?: unknown;
    };

    // A3 — runtime validation (cast alone is not validation)
    if (body.type !== 'certification' && body.type !== 'public_exam') {
      throw Object.assign(new Error('Invalid type'), { status: 400 });
    }
    if (typeof body.refKey !== 'string' || body.refKey.length === 0 || body.refKey.length > 200) {
      throw Object.assign(new Error('Invalid refKey'), { status: 400 });
    }
    if (typeof body.refName !== 'string' || body.refName.length === 0 || body.refName.length > 300) {
      throw Object.assign(new Error('Invalid refName'), { status: 400 });
    }
    if (body.examBoardName !== undefined && typeof body.examBoardName !== 'string') {
      throw Object.assign(new Error('Invalid examBoardName'), { status: 400 });
    }
    if (body.language !== undefined && !isGenerationLanguage(body.language)) {
      throw Object.assign(new Error('Invalid language'), { status: 400 });
    }
    if (!Array.isArray(body.distribution)) {
      throw Object.assign(new Error('Invalid distribution'), { status: 400 });
    }

    const distribution = body.distribution as Array<{ topicName?: unknown; questionCount?: unknown }>;
    const invalidEntry = distribution.some(
      (entry) =>
        typeof entry.topicName !== 'string' ||
        entry.topicName.length === 0 ||
        entry.topicName.length > 300 ||
        !Number.isInteger(entry.questionCount)
    );
    if (invalidEntry) {
      throw Object.assign(new Error('Invalid distribution entry'), { status: 400 });
    }

    const validTopics = (distribution as Array<{ topicName: string; questionCount: number }>).filter(
      (entry) => entry.questionCount > 0
    );
    if (validTopics.length === 0) {
      throw Object.assign(new Error('Distribution must have at least one topic with questions'), { status: 400 });
    }

    // C4 — per-job topic cap (Vercel Hobby maxDuration budget)
    if (validTopics.length > GENERATION_MAX_TOPICS_PER_JOB) {
      throw Object.assign(
        new Error(
          `This job has ${validTopics.length} topics, which exceeds the limit of ${GENERATION_MAX_TOPICS_PER_JOB}. Split it into smaller jobs to proceed.`
        ),
        { status: 400 }
      );
    }

    // C5 — per-topic question cap (output would exceed max_output_tokens)
    if (validTopics.some((entry) => entry.questionCount > GENERATION_MAX_QUESTIONS_PER_TOPIC)) {
      throw Object.assign(new Error(`Maximum ${GENERATION_MAX_QUESTIONS_PER_TOPIC} questions per topic`), {
        status: 400,
      });
    }

    // M6 — ownership: the refKey (Exam.id) must belong to the authenticated user
    const exam = await prisma.exam.findFirst({
      where: { id: body.refKey, userId: session.user.id, type: body.type },
      select: { id: true },
    });
    if (!exam) throw Object.assign(new Error('Exam not found'), { status: 404 });

    // A2 — cap active jobs per user
    const activeJobCount = await prisma.generationJob.count({
      where: {
        userId: session.user.id,
        status: { in: ['queued', 'running', 'saving'] },
      },
    });
    if (activeJobCount >= GENERATION_MAX_ACTIVE_JOBS_PER_USER) {
      throw Object.assign(
        new Error(
          `You already have ${activeJobCount} generations in progress (limit ${GENERATION_MAX_ACTIVE_JOBS_PER_USER}). Wait for one to finish or review its results before starting another.`
        ),
        { status: 429 }
      );
    }

    // B1 — reject early if the user has no remaining quota for even one question
    const quotaService = new QuotaService();
    await quotaService.check(session.user.id, 'generate_questions', 1);

    // Concursos are always Brazilian Portuguese (their prompts hard-code it); the
    // selector only varies certification jobs.
    const language = body.type === 'public_exam' ? 'pt' : resolveGenerationLanguage(body.language);

    const job = await prisma.generationJob.create({
      data: {
        userId: session.user.id,
        type: body.type,
        refKey: body.refKey,
        refName: body.refName,
        examBoardName: body.type === 'public_exam' ? ((body.examBoardName as string | undefined) ?? null) : null,
        language,
        status: 'queued',
        topics: {
          create: validTopics.map((entry) => ({
            topicName: entry.topicName,
            questionCount: entry.questionCount,
            status: 'queued',
          })),
        },
      },
    });

    const claimed = await claimSlots(session.user.id);
    for (const topicId of claimed) after(() => processTopic(topicId));

    return NextResponse.json({ jobId: job.id }, { status: 200 });
  } catch (err: unknown) {
    console.error('[generation-job POST]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Retorna todos os jobs ativos do usuário (para o provider central reconectar).
    const jobs = await prisma.generationJob.findMany({
      where: { userId: session.user.id, status: { in: ['queued', 'running', 'saving'] } },
      orderBy: { createdAt: 'desc' },
      include: { topics: { orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json(jobs.map(shapeJob), { status: 200 });
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
