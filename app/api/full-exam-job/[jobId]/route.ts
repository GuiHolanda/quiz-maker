import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = await params;
    const job = await prisma.fullExamJob.findFirst({
      where: { id: jobId, userId: session.user.id },
      include: { topics: { orderBy: { createdAt: 'asc' } } },
    });

    if (!job) {
      throw Object.assign(new Error('Job not found'), { status: 404 });
    }

    return NextResponse.json(
      {
        id: job.id,
        status: job.status,
        totalTopics: job.totalTopics,
        doneTopics: job.doneTopics,
        savedCount: job.savedCount,
        type: job.type,
        refKey: job.refKey,
        topics: job.topics.map((t) => ({
          id: t.id,
          topicName: t.topicName,
          questionCount: t.questionCount,
          status: t.status,
          savedCount: t.savedCount,
          errorMessage: t.errorMessage,
        })),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = await params;
    const job = await prisma.fullExamJob.findFirst({
      where: { id: jobId, userId: session.user.id },
    });

    if (!job) {
      throw Object.assign(new Error('Job not found'), { status: 404 });
    }

    if (job.status !== 'running') {
      throw Object.assign(new Error('Job is not running'), { status: 409 });
    }

    await prisma.fullExamJob.update({
      where: { id: jobId },
      data: { status: 'error' },
    });

    await prisma.fullExamJobTopic.updateMany({
      where: { jobId, status: { in: ['pending', 'running'] } },
      data: { status: 'error', errorMessage: 'Cancelled by user' },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
