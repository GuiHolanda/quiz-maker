import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { readAutoConfigProgress, type AutoConfigJobSnapshot } from '@/features/services/job-progress.service';

export const maxDuration = 300;

const TERMINAL = ['done', 'error', 'cancelled'];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;

  // Dono continua vindo do Postgres: o snapshot é indexado só por jobId e não pode
  // responder por autorização.
  const owned = await prisma.autoConfigJob.findFirst({
    where: { id: jobId, userId: session.user.id },
    select: { id: true },
  });

  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const job = await readAutoConfigProgress(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let pollIntervalRef: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: object) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      function emitTerminal(current: AutoConfigJobSnapshot) {
        if (current.status === 'done') {
          send('done', { exam: current.resultJson ? JSON.parse(current.resultJson) : null });
        } else if (current.status === 'cancelled') {
          send('cancelled', { message: 'Job cancelled' });
        } else {
          send('error', { message: current.errorMessage ?? 'Auto-config failed', errorType: current.errorType });
        }
      }

      if (TERMINAL.includes(job.status)) {
        emitTerminal(job);
        controller.close();
        return;
      }

      send('progress', { stage: job.stage });

      let polling = false;
      const pollInterval = setInterval(async () => {
        if (polling) return;
        polling = true;
        try {
          const current = await readAutoConfigProgress(jobId);
          if (!current) {
            clearInterval(pollInterval);
            controller.close();
            return;
          }
          if (TERMINAL.includes(current.status)) {
            clearInterval(pollInterval);
            emitTerminal(current);
            controller.close();
            return;
          }
          send('progress', { stage: current.stage });
        } catch {
          clearInterval(pollInterval);
          controller.close();
        } finally {
          polling = false;
        }
      }, 1500);
      pollIntervalRef = pollInterval;
    },
    cancel() {
      if (pollIntervalRef) clearInterval(pollIntervalRef);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
