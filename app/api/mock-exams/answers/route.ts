import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { AIPublicExamQuestion } from '@/shared/types';
import { prisma } from '@/lib/prisma';
import { OpenAIService } from '@/features/services/openAI.service';
import { PublicExamQuestionService } from '@/features/services/question.service';
import { publicExamAnswersPrompt } from '@/config/prompts/public-exam-answers.prompt';

export const maxDuration = 300;

const openAIService = new OpenAIService();
const questionService = new PublicExamQuestionService();

// Process answers in chunks so a single OpenAI call stays well within the
// function timeout even on slow responses or when the user finishes a long
// simulado without any pre-generated explanations.
const BATCH_SIZE = 10;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const questions: AIPublicExamQuestion[] = await request.json();

    if (!questions?.length) return NextResponse.json({ message: 'No questions', count: 0 });

    const questionIds = questions.map((q) => q.id) as number[];

    const existing = await prisma.publicExamAnswer.findMany({
      where: { questionId: { in: questionIds } },
      select: { questionId: true },
    });
    const existingIds = new Set(existing.map((a) => a.questionId));
    const needsAnswer = questions.filter((q) => !existingIds.has(q.id as unknown as number));

    if (!needsAnswer.length) return NextResponse.json({ message: 'All answers already exist', count: 0 });

    const { publicExamName, examBoardName } = needsAnswer[0];

    const publicExam = await prisma.publicExam.findFirst({
      where: { name: publicExamName, userId: session.user.id },
      select: { role: true },
    });

    let totalGenerated = 0;

    for (let i = 0; i < needsAnswer.length; i += BATCH_SIZE) {
      const slice = needsAnswer.slice(i, i + BATCH_SIZE);
      const { subject, topic } = slice[0];

      const llmResponse = await openAIService.call(publicExamAnswersPrompt, {
        public_exam_name: publicExamName,
        exam_board_name: examBoardName,
        role: publicExam?.role ?? undefined,
        subject_name: subject,
        topic_name: topic,
        questions: slice,
      });

      const formatted = JSON.parse(llmResponse);

      if (Array.isArray(formatted?.answers)) {
        await questionService.saveAnswers(formatted.answers);
        totalGenerated += formatted.answers.length;
      }
    }

    return NextResponse.json({ message: 'Answers generated', count: totalGenerated });
  } catch (e: unknown) {
    const err = e as Error & { status?: number };

    console.error('mock-exams/answers failed:', err);

    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message ?? 'Failed to generate answers' },
      { status: err.status ?? 500 }
    );
  }
}
