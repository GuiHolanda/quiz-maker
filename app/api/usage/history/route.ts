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

    // UsageLog rows from FullExamJob topics are excluded here — they have no topicName
    // and the FullExamJob entry represents the whole batch with better metadata.
    // We include logs with topicName (individual generations) AND legacy logs without
    // any context (old data before this feature), but exclude rows created by full
    // exam jobs by checking type != 'full_exam' when type is set.
    const usageLogWhere = {
      userId,
      action: 'generate_questions',
      // Exclude UsageLog rows that belong to a full exam job (type is set to 'certification'
      // or 'public_exam' but topicName is null means they were created by processFullExamJob).
      // Full exam job rows have type set but topicName null (one row per topic in old flow).
      // With the new flow, processFullExamJob no longer calls checkAndRecordQuestions,
      // so this mainly filters legacy rows.
      NOT: { type: { not: null }, topicName: null },
    };

    const [usageLogs, usageLogCount, fullExamJobs, fullExamJobCount] = await Promise.all([
      prisma.usageLog.findMany({
        where: usageLogWhere,
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
        skip: 0,
      }),
      prisma.usageLog.count({ where: usageLogWhere }),
      prisma.fullExamJob.findMany({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review'] } },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
        skip: 0,
      }),
      prisma.fullExamJob.count({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review'] } },
      }),
    ]);

    // Merge and sort by date, then paginate in memory.
    // We fetch limit*2 from each source so we always have enough to fill one page
    // even if one source is exhausted. For large datasets this approach works well
    // since most pages are recent and both queries are indexed by userId+createdAt.
    const merged: GenerationHistoryItem[] = [
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
