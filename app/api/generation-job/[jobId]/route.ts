import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { publishGenerationProgress } from '@/features/services/job-progress.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { claimGlobalSlotsAndDispatch } from '@/features/services/generation-job.service';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = await params;
    const job = await prisma.generationJob.findFirst({
      where: { id: jobId, userId: session.user.id },
      include: { topics: { orderBy: { createdAt: 'asc' } } },
    });

    if (!job) {
      throw Object.assign(new Error('Job not found'), { status: 404 });
    }

    const doneTopics = job.topics.filter((t) => t.status === 'done' || t.status === 'error').length;
    const queuedTopics = job.topics.filter((t) => t.status === 'queued').length;

    return NextResponse.json(
      {
        id: job.id,
        status: job.status,
        totalTopics: job.topics.length,
        doneTopics,
        queuedTopics,
        savedCount: job.savedCount,
        type: job.type,
        refKey: job.refKey,
        refName: job.refName,
        examBoardName: job.examBoardName,
        topics: job.topics.map((t) => ({
          id: t.id,
          topicName: t.topicName,
          questionCount: t.questionCount,
          status: t.status,
          savedCount: t.savedCount,
          errorMessage: t.errorMessage,
          errorType: t.errorType,
        })),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = await params;
    const job = await prisma.generationJob.findFirst({
      where: { id: jobId, userId: session.user.id },
    });

    if (!job) {
      throw Object.assign(new Error('Job not found'), { status: 404 });
    }

    if (job.status !== 'running' && job.status !== 'queued') {
      throw Object.assign(new Error('Job cannot be cancelled'), { status: 409 });
    }

    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: 'cancelled' },
    });

    // Descarta as questões pendentes (nunca foram salvas na biblioteca). Tópicos que
    // chegaram a "done" mantêm esse status — geraram questões de fato, e a contagem é real.
    // Apenas tópicos não-finalizados (na fila ou gerando) passam a "cancelled".
    await prisma.generationJobTopic.updateMany({
      where: { jobId, status: { in: ['done'] } },
      data: { pendingQuestionsJson: null },
    });
    await prisma.generationJobTopic.updateMany({
      where: { jobId, status: { in: ['queued', 'running'] } },
      data: { status: 'cancelled', errorMessage: null },
    });

    await publishGenerationProgress(jobId);

    // Libera os slots ocupados por este job para que jobs na fila (de qualquer usuário) avancem.
    after(() => claimGlobalSlotsAndDispatch());

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
