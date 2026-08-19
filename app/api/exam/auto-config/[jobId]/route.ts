import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { cancelAutoConfigJob } from '@/features/services/auto-config-job.service';
import { toApiErrorResponse } from '@/lib/api-error';

// Polling fallback for clients that can't hold an SSE connection open.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await prisma.autoConfigJob.findFirst({ where: { id: jobId, userId: session.user.id } });

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    type: job.type,
    seedName: job.seedName,
    seedProvider: job.seedProvider,
    status: job.status,
    stage: job.stage,
    errorMessage: job.errorMessage,
    errorType: job.errorType,
    resultJson: job.status === 'done' ? job.resultJson : null,
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = await params;
    await cancelAutoConfigJob(jobId, session.user.id);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Failed to cancel auto-config job:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
