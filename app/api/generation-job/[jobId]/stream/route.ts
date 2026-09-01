import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;

type TopicShape = {
  id: string;
  topicName: string;
  questionCount: number;
  status: string;
  savedCount: number;
  errorMessage: string | null;
  errorType: string | null;
};

function shapeTopics(topics: TopicShape[]) {
  return topics.map((t) => ({
    id: t.id,
    topicName: t.topicName,
    questionCount: t.questionCount,
    status: t.status,
    savedCount: t.savedCount,
    errorMessage: t.errorMessage,
    errorType: t.errorType,
  }));
}

function counts(topics: TopicShape[]) {
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

  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId: session.user.id },
    include: { topics: { orderBy: { createdAt: 'asc' } } },
  });

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

      function emitTerminal(status: string, topics: TopicShape[], savedCount: number) {
        if (status === 'done') {
          send('done', { ...counts(topics), savedCount, topics: shapeTopics(topics) });
        } else {
          send(status, { message: 'Job ended', ...counts(topics), topics: shapeTopics(topics) });
        }
      }

      if (TERMINAL.includes(job.status)) {
        emitTerminal(job.status, job.topics, job.savedCount);
        controller.close();
        return;
      }

      // 'queued' e 'running' emitem progress — a UI distingue via os status dos tópicos.
      send('progress', { ...counts(job.topics), savedCount: job.savedCount, topics: shapeTopics(job.topics) });

      let polling = false;
      const pollInterval = setInterval(async () => {
        if (polling) return;
        polling = true;
        try {
          const current = await prisma.generationJob.findUnique({
            where: { id: jobId },
            include: { topics: { orderBy: { createdAt: 'asc' } } },
          });
          if (!current) {
            clearInterval(pollInterval);
            controller.close();
            return;
          }
          if (TERMINAL.includes(current.status)) {
            clearInterval(pollInterval);
            emitTerminal(current.status, current.topics, current.savedCount);
            controller.close();
            return;
          }
          send('progress', {
            ...counts(current.topics),
            savedCount: current.savedCount,
            topics: shapeTopics(current.topics),
          });
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
