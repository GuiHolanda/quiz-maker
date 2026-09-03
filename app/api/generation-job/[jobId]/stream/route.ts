import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  readGenerationProgress,
  type GenerationJobSnapshot,
  type GenerationTopicSnapshot,
} from '@/features/services/job-progress.service';

export const maxDuration = 300;

function counts(topics: GenerationTopicSnapshot[]) {
  return {
    totalTopics: topics.length,
    doneTopics: topics.filter((t) => t.status === 'done' || t.status === 'error').length,
    queuedTopics: topics.filter((t) => t.status === 'queued').length,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;

  // A checagem de dono continua no Postgres e fora do snapshot: o cache é indexado só por
  // jobId, então deixá-lo responder por autorização daria a qualquer sessão o progresso de
  // um job alheio.
  const owned = await prisma.generationJob.findFirst({
    where: { id: jobId, userId: session.user.id },
    select: { id: true },
  });

  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const job = await readGenerationProgress(jobId);

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

      const TERMINAL = ['done', 'error', 'cancelled'];

      function emitTerminal(snapshot: GenerationJobSnapshot) {
        if (snapshot.status === 'done') {
          send('done', { ...counts(snapshot.topics), savedCount: snapshot.savedCount, topics: snapshot.topics });
        } else {
          send(snapshot.status, { message: 'Job ended', ...counts(snapshot.topics), topics: snapshot.topics });
        }
      }

      if (TERMINAL.includes(job.status)) {
        emitTerminal(job);
        controller.close();
        return;
      }

      // 'queued' e 'running' emitem progress — a UI distingue via os status dos tópicos.
      send('progress', { ...counts(job.topics), savedCount: job.savedCount, topics: job.topics });

      let polling = false;
      const pollInterval = setInterval(async () => {
        if (polling) return;
        polling = true;
        try {
          const current = await readGenerationProgress(jobId);

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
          send('progress', { ...counts(current.topics), savedCount: current.savedCount, topics: current.topics });
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
