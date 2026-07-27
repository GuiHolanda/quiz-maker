import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { prisma } from '@/lib/prisma';
import { claimGlobalSlotsAndDispatch } from '@/features/services/generation-job.service';

// Called by Vercel Cron — secured via CRON_SECRET header
export const maxDuration = 60;

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  // Jobs travados em 'running' ou 'queued' (nunca promovidos por falha) além do TTL.
  const staleJobs = await prisma.generationJob.findMany({
    where: { status: { in: ['running', 'queued'] }, updatedAt: { lt: cutoff } },
    select: { id: true },
  });

  if (staleJobs.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const staleIds = staleJobs.map((j) => j.id);

  await prisma.generationJob.updateMany({
    where: { id: { in: staleIds } },
    data: { status: 'error' },
  });

  await prisma.generationJobTopic.updateMany({
    where: { jobId: { in: staleIds }, status: { in: ['queued', 'running'] } },
    data: { status: 'error', errorMessage: 'Job timed out' },
  });

  // Libera os slots que os jobs travados ocupavam e destrava a fila global.
  after(() => claimGlobalSlotsAndDispatch());

  console.log(`[cleanup-stale-jobs] Cleaned ${staleIds.length} stale jobs`);

  return NextResponse.json({ cleaned: staleIds.length });
}
