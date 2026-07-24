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

    const [usageLogs, usageLogCount, fullExamJobs, fullExamJobCount] = await Promise.all([
      prisma.usageLog.findMany({
        where: { userId, action: 'generate_questions' },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      }),
      prisma.usageLog.count({ where: { userId, action: 'generate_questions' } }),
      prisma.fullExamJob.findMany({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review'] } },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      }),
      prisma.fullExamJob.count({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review'] } },
      }),
    ]);

    const allItems: GenerationHistoryItem[] = [
      ...usageLogs.map((log): GenerationHistoryItem => ({
        id: log.id,
        source: 'usage_log',
        type: 'individual',
        refName: log.refName ?? null,
        topicName: log.topicName ?? null,
        questionsSaved: log.count,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        status: 'done',
        createdAt: log.createdAt.toISOString(),
      })),
      ...fullExamJobs.map((job): GenerationHistoryItem => ({
        id: job.id,
        source: 'full_exam_job',
        type: 'full_exam',
        refName: job.refName,
        topicName: null,
        questionsSaved: job.savedCount,
        inputTokens: null,
        outputTokens: null,
        status: job.status as GenerationHistoryItem['status'],
        createdAt: job.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * limit, page * limit);

    const response: GenerationHistoryResponse = {
      items: allItems,
      total: usageLogCount + fullExamJobCount,
      page,
      limit,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    console.error('[usage/history GET]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
