import { NextRequest, NextResponse } from 'next/server';

import { CertificationQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { AIQuestion } from '@/shared/types';
import { auth } from '@/auth';

const questionService = new CertificationQuestionService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIQuestion[] = validateAiQuestions(payload) as AIQuestion[];

    await questionService.createFromPayload(questions, session.user.id);

    return NextResponse.json({ message: 'Questions saved successfully', count: questions.length }, { status: 200 });
  } catch (err: any) {
    console.error('Failed to process request:', err);

    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
