import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OpenAIService } from '@/features/services/openAI.service';
import { ExamQuestionService } from '@/features/services/exam-question.service';
import { certificationExplanationsPrompt } from '@/config/prompts/certification-questions/explanations.prompt';
import { publicExamExplanationsPrompt } from '@/config/prompts/public-exam-questions/explanations.prompt';
import { toApiErrorResponse } from '@/lib/api-error';

export const maxDuration = 300;

const openAIService = new OpenAIService();
const questionService = new ExamQuestionService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
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
