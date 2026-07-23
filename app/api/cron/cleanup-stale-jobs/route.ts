import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Called by Vercel Cron — secured via CRON_SECRET header
export const maxDuration = 60;

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  const staleJobs = await prisma.fullExamJob.findMany({
    where: { status: 'running', updatedAt: { lt: cutoff } },
    select: { id: true },
  });

  if (staleJobs.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const staleIds = staleJobs.map((j) => j.id);

  await prisma.fullExamJob.updateMany({
    where: { id: { in: staleIds } },
    data: { status: 'error' },
  });

  await prisma.fullExamJobTopic.updateMany({
    where: { jobId: { in: staleIds }, status: { in: ['pending', 'running'] } },
    data: { status: 'error', errorMessage: 'Job timed out' },
  });

  console.log(`[cleanup-stale-jobs] Cleaned ${staleIds.length} stale jobs`);

  return NextResponse.json({ cleaned: staleIds.length });
}
