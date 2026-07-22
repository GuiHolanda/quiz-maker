import { NextRequest, NextResponse } from 'next/server';

import { PublicExamQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { AIPublicExamQuestion } from '@/shared/types';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

const questionService = new PublicExamQuestionService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIPublicExamQuestion[] = validateAiQuestions(payload) as AIPublicExamQuestion[];

    await questionService.createFromPayload(questions, session.user.id);

    return NextResponse.json(
      { message: 'Public exam questions saved successfully', count: questions.length },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Failed to process request:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
