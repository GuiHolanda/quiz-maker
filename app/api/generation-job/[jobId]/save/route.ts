import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import {
  CertificationQuestionService,
  PublicExamQuestionService,
  validateAiQuestions,
} from '@/features/services/question.service';
import type { AIQuestion, AIPublicExamQuestion } from '@/shared/types';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const body = (await request.json()) as { topicIds?: string[] };

    const job = await prisma.fullExamJob.findFirst({
      where: { id: jobId, userId: session.user.id, status: 'awaiting_review' },
      include: { topics: true },
    });

    if (!job) {
      throw Object.assign(new Error('Job not found or not in awaiting_review state'), { status: 404 });
    }

    const topicsToSave = body.topicIds
      ? job.topics.filter((t) => body.topicIds!.includes(t.id) && t.pendingQuestionsJson)
      : job.topics.filter((t) => t.pendingQuestionsJson);

    let totalSaved = 0;

    for (const topic of topicsToSave) {
      const raw = JSON.parse(topic.pendingQuestionsJson!);
      // pendingQuestionsJson stores a plain array; validateAiQuestions expects { questions: [] }
      const payload = Array.isArray(raw) ? { questions: raw } : raw;
      const questions = validateAiQuestions(payload);

      if (job.type === 'certification') {
        const certService = new CertificationQuestionService();
        await certService.createFromPayload(questions as AIQuestion[], session.user.id);
      } else {
        const examService = new PublicExamQuestionService();
        await examService.createFromPayload(questions as AIPublicExamQuestion[], session.user.id);
      }

      await prisma.fullExamJobTopic.update({
        where: { id: topic.id },
        data: { savedCount: questions.length, pendingQuestionsJson: null },
      });

      totalSaved += questions.length;
    }

    await prisma.fullExamJob.update({
      where: { id: jobId },
      data: { status: 'done', savedCount: { increment: totalSaved } },
    });

    return NextResponse.json({ savedCount: totalSaved }, { status: 200 });
  } catch (err: unknown) {
    console.error('[full-exam-job save POST]', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
