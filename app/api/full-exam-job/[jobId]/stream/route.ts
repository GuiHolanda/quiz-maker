import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;

  const job = await prisma.fullExamJob.findFirst({
    where: { id: jobId, userId: session.user.id },
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
        send('done', { doneTopics: job.doneTopics, totalTopics: job.totalTopics, savedCount: job.savedCount });
        controller.close();
        return;
      }

      if (job.status === 'error') {
        send('error', { message: 'Job failed' });
        controller.close();
        return;
      }

      send('progress', { doneTopics: job.doneTopics, totalTopics: job.totalTopics, savedCount: job.savedCount });

      const pollInterval = setInterval(async () => {
        try {
          const current = await prisma.fullExamJob.findUnique({ where: { id: jobId } });
          if (!current) {
            clearInterval(pollInterval);
            controller.close();
            return;
          }

          if (current.status === 'done') {
            clearInterval(pollInterval);
            send('done', {
              doneTopics: current.doneTopics,
              totalTopics: current.totalTopics,
              savedCount: current.savedCount,
            });
            controller.close();
          } else if (current.status === 'error') {
            clearInterval(pollInterval);
            send('error', { message: 'Job failed' });
            controller.close();
          } else {
            send('progress', {
              doneTopics: current.doneTopics,
              totalTopics: current.totalTopics,
              savedCount: current.savedCount,
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
