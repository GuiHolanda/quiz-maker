import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/app/api/generator/question-generator/question.service';
import { AIQuestion } from '@/types';
import { auth } from '@/auth';

const questionService = new QuestionService();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIQuestion[] = questionService.getValidatedQuestions(payload);

    await questionService.createFromPayload(questions, session.user.id);

    return NextResponse.json(
      { message: 'Questions saved successfully', count: questions.length },
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
