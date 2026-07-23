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
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
