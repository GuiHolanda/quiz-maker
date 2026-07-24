import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import type { GenerationHistoryItem, GenerationHistoryResponse } from '@/shared/types';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') ?? '10', 10)));
    const userId = session.user.id;

    const usageLogWhere = {
      userId,
      action: 'generate_questions',
      refName: { not: null },
      topicName: { not: null },
    };

    const fetchCount = page * limit;

    const [usageLogs, usageLogCount, fullExamJobs] = await Promise.all([
      prisma.usageLog.findMany({
        where: usageLogWhere,
        orderBy: { createdAt: 'desc' },
        take: fetchCount,
      }),
      prisma.usageLog.count({ where: usageLogWhere }),
      prisma.fullExamJob.findMany({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review'] } },
        orderBy: { createdAt: 'desc' },
        take: fetchCount,
        include: {
          topics: {
            select: { id: true, topicName: true, questionCount: true, savedCount: true, status: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    // Expand FullExamJob topics into individual rows — one row per topic
    const fullExamItems: GenerationHistoryItem[] = fullExamJobs.flatMap((job) =>
      job.topics.map((topic) => ({
        id: `${job.id}__${topic.id}`,
        source: 'full_exam_job' as const,
        type: 'full_exam' as const,
        refName: job.refName,
        topicName: topic.topicName,
        questionsGenerated: topic.questionCount,
        questionsSaved: topic.savedCount,
        status: topic.status === 'done'
          ? ('done' as const)
          : topic.status === 'error'
            ? ('error' as const)
            : ('awaiting_review' as const),
        createdAt: job.createdAt.toISOString(),
      })),
    );

    const fullExamItemCount = fullExamJobs.reduce((acc, job) => acc + job.topics.length, 0);

    const merged: GenerationHistoryItem[] = [
      ...usageLogs.map((log): GenerationHistoryItem => ({
        id: log.id,
        source: 'usage_log',
        type: 'individual',
        refName: log.refName ?? null,
        topicName: log.topicName ?? null,
        questionsGenerated: log.count,
        questionsSaved: log.count,
        status: 'done',
        createdAt: log.createdAt.toISOString(),
      })),
      ...fullExamItems,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items = merged.slice((page - 1) * limit, page * limit);
    const total = usageLogCount + fullExamItemCount;

    const response: GenerationHistoryResponse = { items, total, page, limit };
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    console.error('[usage/history GET]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
