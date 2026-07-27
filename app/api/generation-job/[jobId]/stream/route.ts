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
};

function shapeTopics(topics: TopicShape[]) {
  return topics.map((t) => ({
    id: t.id,
    topicName: t.topicName,
    questionCount: t.questionCount,
    status: t.status,
    savedCount: t.savedCount,
    errorMessage: t.errorMessage,
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

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: object) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      if (job.status === 'done') {
        send('done', { ...counts(job.topics), savedCount: job.savedCount, topics: shapeTopics(job.topics) });
        controller.close();
        return;
      }

      if (job.status === 'awaiting_review') {
        send('awaiting_review', { ...counts(job.topics), topics: shapeTopics(job.topics) });
        controller.close();
        return;
      }

      if (job.status === 'error') {
        send('error', { message: 'Job failed', ...counts(job.topics), topics: shapeTopics(job.topics) });
        controller.close();
        return;
      }

      // 'queued' e 'running' emitem progress — a UI distingue via os status dos tópicos.
      send('progress', { ...counts(job.topics), savedCount: job.savedCount, topics: shapeTopics(job.topics) });

      const pollInterval = setInterval(async () => {
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

          if (current.status === 'done') {
            clearInterval(pollInterval);
            send('done', {
              ...counts(current.topics),
              savedCount: current.savedCount,
              topics: shapeTopics(current.topics),
            });
            controller.close();
          } else if (current.status === 'awaiting_review') {
            clearInterval(pollInterval);
            send('awaiting_review', { ...counts(current.topics), topics: shapeTopics(current.topics) });
            controller.close();
          } else if (current.status === 'error') {
            clearInterval(pollInterval);
            send('error', { message: 'Job failed', ...counts(current.topics), topics: shapeTopics(current.topics) });
            controller.close();
          } else {
            send('progress', {
              ...counts(current.topics),
              savedCount: current.savedCount,
              topics: shapeTopics(current.topics),
            });
          }
        } catch {
          clearInterval(pollInterval);
          controller.close();
        }
      }, 1500);
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
