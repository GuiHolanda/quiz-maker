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
    const domain = searchParams.get('domain') as 'certification' | 'public_exam' | null;
    const sourceParam = searchParams.getAll('source');
    const topicParam = searchParams.getAll('topic');
    const statusParam = searchParams.getAll('status');
    const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
    const userId = session.user.id;

    const usageLogWhere = {
      userId,
      action: 'generate_questions',
      refName: { not: null },
      topicName: { not: null },
    };

    const fetchCount = page * limit;

    const [usageLogs, fullExamJobs] = await Promise.all([
      prisma.usageLog.findMany({
        where: usageLogWhere,
        orderBy: { createdAt: sort },
        take: fetchCount,
      }),
      prisma.fullExamJob.findMany({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review'] } },
        orderBy: { createdAt: sort },
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
        domain: (job.type === 'public_exam' ? 'public_exam' : 'certification') as 'certification' | 'public_exam',
        refName: job.refName,
        topicName: topic.topicName,
        questionsGenerated: topic.status === 'done' ? topic.questionCount : 0,
        questionsSaved: topic.savedCount,
        status:
          topic.status === 'done'
            ? ('done' as const)
            : topic.status === 'error'
              ? ('error' as const)
              : ('awaiting_review' as const),
        createdAt: job.createdAt.toISOString(),
      }))
    );

    let merged: GenerationHistoryItem[] = [
      ...usageLogs.map(
        (log): GenerationHistoryItem => ({
          id: log.id,
          source: 'usage_log',
          type: 'individual',
          domain: (log.type === 'public_exam' ? 'public_exam' : 'certification') as 'certification' | 'public_exam',
          refName: log.refName ?? null,
          topicName: log.topicName ?? null,
          questionsGenerated: log.count,
          questionsSaved: log.count,
          status: 'done',
          createdAt: log.createdAt.toISOString(),
        })
      ),
      ...fullExamItems,
    ].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === 'asc' ? -diff : diff;
    });

    // Apply filters post-merge
    if (domain) {
      merged = merged.filter((item) => item.domain === domain);
    }
    if (sourceParam.length > 0) {
      merged = merged.filter((item) => item.refName !== null && sourceParam.includes(item.refName));
    }
    if (topicParam.length > 0) {
      merged = merged.filter((item) => item.topicName !== null && topicParam.includes(item.topicName));
    }
    if (statusParam.length > 0) {
      merged = merged.filter((item) => statusParam.includes(item.status));
    }

    const total = merged.length;
    const items = merged.slice((page - 1) * limit, page * limit);

    const response: GenerationHistoryResponse = { items, total, page, limit };
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    console.error('[usage/history GET]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
