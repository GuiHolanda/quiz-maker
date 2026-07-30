import { NextRequest, NextResponse } from 'next/server';

import { ExamQuestionService, validateAiQuestions } from '@/features/services/exam-question.service';
import { AIExamQuestion } from '@/shared/types';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

const questionService = new ExamQuestionService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIExamQuestion[] = validateAiQuestions(payload) as AIExamQuestion[];
    const examId: string | undefined = typeof body?.examId === 'string' ? body.examId : undefined;

    await questionService.createFromPayload(questions, session.user.id, examId);

    return NextResponse.json({ message: 'Questions saved successfully', count: questions.length }, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to process request:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
