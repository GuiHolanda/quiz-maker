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

    const [usageLogs, generationJobs] = await Promise.all([
      prisma.usageLog.findMany({
        where: usageLogWhere,
        orderBy: { createdAt: sort },
      }),
      prisma.generationJob.findMany({
        where: { userId, status: { in: ['done', 'error', 'awaiting_review', 'running', 'queued', 'cancelled'] } },
        orderBy: { createdAt: sort },
        include: {
          topics: {
            select: { id: true, topicName: true, questionCount: true, savedCount: true, status: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    // Build a refKey → role lookup for public_exam entries (one DB call for all unique keys).
    const publicExamRefKeys = new Set<string>();
    for (const job of generationJobs) {
      if (job.type === 'public_exam' && job.refKey) publicExamRefKeys.add(job.refKey);
    }
    for (const log of usageLogs) {
      if (log.type === 'public_exam' && log.refKey) publicExamRefKeys.add(log.refKey);
    }
    const examRoles = new Map<string, string | null>();
    if (publicExamRefKeys.size > 0) {
      const exams = await prisma.exam.findMany({
        where: { id: { in: Array.from(publicExamRefKeys) } },
        select: { id: true, role: true },
      });
      for (const exam of exams) examRoles.set(exam.id, exam.role ?? null);
    }

    // UsageLog rows created by the GenerationJob pipeline (via checkAndRecordQuestions) are
    // already represented as GenerationJob topic rows. Dedup by excluding UsageLogs that
    // match a known (refName, topicName, count) tuple from any generation job topic.
    const jobTopicKeys = new Set<string>();
    for (const job of generationJobs) {
      for (const topic of job.topics) {
        jobTopicKeys.add(`${job.refName}__${topic.topicName}__${topic.questionCount}`);
      }
    }
    const filteredUsageLogs = usageLogs.filter(
      (log) => !jobTopicKeys.has(`${log.refName}__${log.topicName}__${log.count}`)
    );

    // Expand GenerationJob topics into individual rows — one row per topic
    const fullExamItems: GenerationHistoryItem[] = generationJobs.flatMap((job) =>
      job.topics.map((topic) => ({
        id: `${job.id}__${topic.id}`,
        source: 'generation_job' as const,
        type: 'full_exam' as const,
        domain: (job.type === 'public_exam' ? 'public_exam' : 'certification') as 'certification' | 'public_exam',
        refName: job.refName,
        refRole: job.type === 'public_exam' ? (examRoles.get(job.refKey) ?? null) : null,
        topicName: topic.topicName,
        questionsGenerated: topic.status === 'done' ? topic.questionCount : 0,
        questionsSaved: topic.savedCount,
        status:
          topic.status === 'done'
            ? job.status === 'cancelled'
              ? ('cancelled' as const)
              : job.status === 'awaiting_review'
                ? ('awaiting_review' as const)
                : ('done' as const)
            : topic.status === 'cancelled'
              ? ('cancelled' as const)
              : topic.status === 'error'
                ? ('error' as const)
                : topic.status === 'queued'
                  ? ('queued' as const)
                  : job.status === 'awaiting_review'
                    ? ('awaiting_review' as const)
                    : ('running' as const),
        createdAt: job.createdAt.toISOString(),
      }))
    );

    let merged: GenerationHistoryItem[] = [
      ...filteredUsageLogs.map(
        (log): GenerationHistoryItem => ({
          id: log.id,
          source: 'usage_log',
          type: 'individual',
          domain: (log.type === 'public_exam' ? 'public_exam' : 'certification') as 'certification' | 'public_exam',
          refName: log.refName ?? null,
          refRole: log.type === 'public_exam' && log.refKey ? (examRoles.get(log.refKey) ?? null) : null,
          topicName: log.topicName ?? null,
          questionsGenerated: log.count,
          questionsSaved: log.count,
          status: 'done',
          createdAt: log.createdAt.toISOString(),
        })
      ),
      ...fullExamItems,
    ].sort((newer, older) => {
      const diff = new Date(older.createdAt).getTime() - new Date(newer.createdAt).getTime();
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
