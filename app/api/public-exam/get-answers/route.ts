import { NextRequest, NextResponse } from 'next/server';

import { PublicExamQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { AIPublicExamQuestion } from '@/shared/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { buildGetPublicExamAnswersPrompt } from '@/config/promptSchemas/getPublicExamAnswers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    const prompt = buildGetPublicExamAnswersPrompt({
      public_exam_name: publicExamName,
      exam_board_name: examBoardName,
      role: publicExam?.role ?? undefined,
      subject_name: subject,
      topic_name: topic,
      questions,
    });

    const llmResponse = await openAIService.getLLMResponseInline(prompt);
    const formattedAnswers = JSON.parse(llmResponse);

    await questionService.saveAnswers(formattedAnswers.answers);

    return NextResponse.json(
      {
        message: 'Public exam answers saved successfully',
        count: formattedAnswers.answers.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Failed to process request:', err);

    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
