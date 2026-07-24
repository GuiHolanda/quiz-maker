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

    // Fetch enough rows from each source to cover any page.
    // For page N we need up to page*limit rows from each source in the worst case.
    const fetchCount = page * limit;

    const [usageLogs, usageLogCount, fullExamJobs, fullExamJobCount] = await Promise.all([
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
      }),
      prisma.fullExamJob.count({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review'] } },
      }),
    ]);

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
      ...fullExamJobs.map((job): GenerationHistoryItem => ({
        id: job.id,
        source: 'full_exam_job',
        type: 'full_exam',
        refName: job.refName,
        topicName: null,
        questionsGenerated: job.totalTopics > 0 ? job.doneTopics : 0,
        questionsSaved: job.savedCount,
        status: job.status as GenerationHistoryItem['status'],
        createdAt: job.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items = merged.slice((page - 1) * limit, page * limit);
    const total = usageLogCount + fullExamJobCount;

    const response: GenerationHistoryResponse = { items, total, page, limit };
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    console.error('[usage/history GET]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
