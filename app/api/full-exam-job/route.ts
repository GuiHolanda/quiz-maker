import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import { processFullExamJob } from '@/features/services/full-exam-job.service';

export const maxDuration = 30;

function shapeJob(job: Awaited<ReturnType<typeof prisma.fullExamJob.findFirst>> & { topics?: { id: string; topicName: string; questionCount: number; status: string; savedCount: number; errorMessage: string | null }[] }) {
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    totalTopics: job.totalTopics,
    doneTopics: job.doneTopics,
    savedCount: job.savedCount,
    type: job.type,
    refKey: job.refKey,
    topics: (job.topics ?? []).map((t) => ({
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

    const job = await prisma.fullExamJob.create({
      data: {
        userId: session.user.id,
        type: body.type,
        refKey: body.refKey,
        refName: body.refName,
        examBoardName: body.examBoardName ?? null,
        status: 'running',
        totalTopics: validTopics.length,
      },
    });

    after(() =>
      processFullExamJob(
        job.id,
        session.user.id,
        body.type,
        body.refName,
        body.examBoardName ?? null,
        validTopics,
      ),
    );

    return NextResponse.json({ jobId: job.id }, { status: 200 });
  } catch (err: unknown) {
    console.error('[full-exam-job POST]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'certification' | 'public_exam' | null;
    const refKey = searchParams.get('refKey');

    if (!type || !refKey) {
      return NextResponse.json(null, { status: 200 });
    }

    const job = await prisma.fullExamJob.findFirst({
      where: { userId: session.user.id, type, refKey, status: 'running' },
      orderBy: { createdAt: 'desc' },
      include: { topics: { orderBy: { createdAt: 'asc' } } },
    });

    if (!job) return NextResponse.json(null, { status: 200 });

    return NextResponse.json(shapeJob(job), { status: 200 });
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
