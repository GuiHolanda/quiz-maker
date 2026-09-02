import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { prisma } from '@/lib/prisma';
import { claimGlobalSlotsAndDispatch } from '@/features/services/generation-job.service';
import { QuotaService } from '@/features/services/quota.service';

// Called by Vercel Cron — secured via CRON_SECRET header
export const maxDuration = 60;

// 10 min: with maybeFinalizeJob heartbeating updatedAt on every completed topic, a live
// job never idles this long. A job untouched for 10 min has genuinely lost its worker
// (deploy, crash, or after() dropped) and is safe to mark as error and reclaim its slots.
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret) {
    console.error('[cleanup-stale-jobs] CRON_SECRET env var is not set — rejecting request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  // Jobs travados em 'running', 'queued' ou 'saving' (nunca promovidos por falha) além do TTL.
  const staleJobs = await prisma.generationJob.findMany({
    where: { status: { in: ['running', 'queued', 'saving'] }, updatedAt: { lt: cutoff } },
    select: { id: true },
  });

  if (staleJobs.length > 0) {
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
  }

  // Mesmo TTL para AutoConfigJob travados — sem slots a liberar, mas cada um debitou
  // uma unidade de auto_config que precisa ser reembolsada antes de marcar como erro.
  const staleAutoConfigJobs = await prisma.autoConfigJob.findMany({
    where: { status: { in: ['running', 'queued'] }, updatedAt: { lt: cutoff } },
    select: { id: true, usageLogId: true },
  });

  if (staleAutoConfigJobs.length > 0) {
    const quotaService = new QuotaService();

    for (const job of staleAutoConfigJobs) {
      if (job.usageLogId) {
        try {
          await quotaService.rollbackQuota(job.usageLogId);
        } catch (err) {
          console.error('[cleanup-stale-jobs] rollbackQuota failed:', err);
        }
      }
    }

    await prisma.autoConfigJob.updateMany({
      where: { id: { in: staleAutoConfigJobs.map((j) => j.id) } },
      data: { status: 'error', errorMessage: 'Job timed out', stage: null },
    });
  }

  const cleaned = staleJobs.length + staleAutoConfigJobs.length;

  console.log(
    `[cleanup-stale-jobs] Cleaned ${staleJobs.length} generation jobs, ${staleAutoConfigJobs.length} auto-config jobs`
  );

  return NextResponse.json({ cleaned });
}
