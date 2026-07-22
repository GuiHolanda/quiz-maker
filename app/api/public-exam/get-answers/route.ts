import { NextRequest, NextResponse } from 'next/server';

import { PublicExamQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { AIPublicExamQuestion } from '@/shared/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { publicExamAnswersPrompt } from '@/config/prompts/public-exam-answers.prompt';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;

const questionService = new PublicExamQuestionService();
const openAIService = new OpenAIService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIPublicExamQuestion[] = validateAiQuestions(payload) as AIPublicExamQuestion[];
    const { publicExamName, examBoardName, subject, topic } = questions[0];

    const publicExam = await prisma.publicExam.findFirst({
      where: { name: publicExamName, userId: session.user.id },
      select: { role: true },
    });

    const llmResponse = await openAIService.call(publicExamAnswersPrompt, {
      public_exam_name: publicExamName,
      exam_board_name: examBoardName,
      role: publicExam?.role ?? undefined,
      subject_name: subject,
      topic_name: topic,
      questions,
    });

    const formattedAnswers = JSON.parse(llmResponse.text);

    await questionService.saveAnswers(formattedAnswers.answers);

    return NextResponse.json(
      {
        message: 'Public exam answers saved successfully',
        count: formattedAnswers.answers.length,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Failed to process request:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
