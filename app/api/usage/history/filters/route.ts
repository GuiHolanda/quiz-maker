import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import type { GenerationHistoryFilterOptions } from '@/shared/types';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const [usageLogRefs, usageLogTopics, generationJobs] = await Promise.all([
      prisma.usageLog.findMany({
        where: { userId, action: 'generate_questions', refName: { not: null } },
        select: { refName: true },
        distinct: ['refName'],
      }),
      prisma.usageLog.findMany({
        where: { userId, action: 'generate_questions', topicName: { not: null } },
        select: { topicName: true },
        distinct: ['topicName'],
      }),
      prisma.generationJob.findMany({
        where: { userId },
        select: {
          refName: true,
          topics: { select: { topicName: true } },
        },
      }),
    ]);

    const fullExamRefs = generationJobs.map((job) => job.refName);
    const fullExamTopics = generationJobs.flatMap((job) => job.topics.map((topic) => topic.topicName));

    const sources = Array.from(new Set([...usageLogRefs.map((r) => r.refName as string), ...fullExamRefs])).sort();

    const topics = Array.from(new Set([...usageLogTopics.map((r) => r.topicName as string), ...fullExamTopics])).sort();

    const response: GenerationHistoryFilterOptions = { sources, topics };
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    console.error('[usage/history/filters GET]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
