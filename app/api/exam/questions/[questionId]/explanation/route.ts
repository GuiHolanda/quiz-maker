import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OpenAIService } from '@/features/services/openAI.service';
import { ExamQuestionService } from '@/features/services/exam-question.service';
import { MetricsService } from '@/features/services/metrics.service';
import { certificationExplanationsPrompt } from '@/config/prompts/certification-questions/explanations.prompt';
import { publicExamExplanationsPrompt } from '@/config/prompts/public-exam-questions/explanations.prompt';
import { toApiErrorResponse } from '@/lib/api-error';
import { enforceRateLimit } from '@/lib/rate-limit';

export const maxDuration = 300;

const openAIService = new OpenAIService();
const questionService = new ExamQuestionService();
const metricsService = new MetricsService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Antes de qualquer débito de quota: uma rajada barrada não deve consumir cota.
    await enforceRateLimit('explanation', session.user.id);

    const { questionId } = await params;
    const id = Number(questionId);

    const question = await prisma.examQuestion.findFirst({
      where: { id, userId: session.user.id },
      include: {
        options: true,
        answer: { include: { explanations: true } },
        exam: { include: { examBoard: true } },
      },
    });

    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!question.answer) return NextResponse.json({ error: 'No answer for this question yet' }, { status: 404 });

    if (question.answer.explanations.length > 0) {
      const explanations = Object.fromEntries(question.answer.explanations.map((e) => [e.label, e.text]));

      return NextResponse.json({ explanations });
    }

    const correctOptions = question.answer.correctOptions as string[];
    const options = Object.fromEntries(question.options.map((o) => [o.label, o.text]));
    const isPublicExam = question.exam?.type === 'public_exam';

    // count: 0 — explanations aren't a billable quota unit (see CLAUDE.md), but tokens
    // still need to land in UsageLogStep so plan margin in /admin/analytics reflects them.
    const logId = await metricsService.createLog(session.user.id, 'generate_explanation', 0);
    const t0 = Date.now();

    const llmResponse = isPublicExam
      ? await openAIService.call(
          publicExamExplanationsPrompt,
          {
            public_exam_name: question.examName,
            exam_board_name: question.exam?.examBoard?.name ?? '',
            role: question.exam?.role ?? undefined,
            subject: question.sectionName,
            topic: question.topicName ?? undefined,
            question: { text: question.text, options, correctOptions },
          },
          { webSearch: false, jsonMode: true }
        )
      : await openAIService.call(
          certificationExplanationsPrompt,
          {
            certification_name: question.examName,
            topic: question.sectionName,
            question: { text: question.text, options, correctOptions },
          },
          { webSearch: false, jsonMode: true }
        );

    const durationMs = Date.now() - t0;

    void metricsService.recordStep(
      logId,
      'explanation',
      { inputTokens: llmResponse.inputTokens, outputTokens: llmResponse.outputTokens },
      durationMs
    );
    await metricsService.finalize(logId, durationMs);

    let explanations: Record<string, string>;
    try {
      ({ explanations } = JSON.parse(llmResponse.text) as { explanations: Record<string, string> });
    } catch {
      console.error('[exam/explanation] JSON parse failed. Raw snippet:', llmResponse.text.slice(0, 300));
      throw Object.assign(new Error('AI returned malformed JSON — please retry'), { status: 502 });
    }

    await questionService.saveExplanations(question.answer.id, explanations);

    return NextResponse.json({ explanations });
  } catch (err: unknown) {
    console.error('Failed to get explanation:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
