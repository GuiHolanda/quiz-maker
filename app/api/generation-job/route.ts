import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import { claimSlots, processTopic } from '@/features/services/generation-job.service';

export const maxDuration = 300;

type JobWithTopics = Awaited<ReturnType<typeof prisma.generationJob.findFirst>> & {
  topics?: {
    id: string;
    topicName: string;
    questionCount: number;
    status: string;
    savedCount: number;
    errorMessage: string | null;
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
      type: 'certification' | 'public_exam';
      refKey: string;
      refName: string;
      examBoardName?: string;
      distribution: Array<{ topicName: string; questionCount: number }>;
    };

    const validTopics = body.distribution.filter((entry) => entry.questionCount > 0);
    if (validTopics.length === 0) {
      throw Object.assign(new Error('Distribution must have at least one topic with questions'), { status: 400 });
    }

    const job = await prisma.generationJob.create({
      data: {
        userId: session.user.id,
        type: body.type,
        refKey: body.refKey,
        refName: body.refName,
        examBoardName: body.examBoardName ?? null,
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

    // Promove os tópicos que couberem nos slots livres e dispara o processamento.
    // O restante fica "queued" e será puxado pelo encadeamento por conclusão.
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
      where: { userId: session.user.id, status: { in: ['queued', 'running', 'awaiting_review'] } },
      orderBy: { createdAt: 'desc' },
      include: { topics: { orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json(jobs.map(shapeJob), { status: 200 });
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
