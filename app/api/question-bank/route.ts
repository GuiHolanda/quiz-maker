import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { QuestionBankService } from '@/features/services/question-bank.service';

const service = new QuestionBankService();

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') ?? 'all';
  const search = searchParams.get('search')?.trim() || undefined;
  const sourceRaw = searchParams
    .getAll('source')
    .map((s) => s.trim())
    .filter(Boolean);
  const source = sourceRaw.length > 0 ? sourceRaw : undefined;
  const topicRaw = searchParams
    .getAll('topic')
    .map((t) => t.trim())
    .filter(Boolean);
  const topic = topicRaw.length > 0 ? topicRaw : undefined;
  const difficultyRaw = searchParams
    .getAll('difficulty')
    .map((d) => d.trim())
    .filter(Boolean);
  const difficulty = difficultyRaw.length > 0 ? difficultyRaw : undefined;
  const hasAnswerRaw = searchParams.get('hasAnswer');
  const hasExplanationRaw = searchParams.get('hasExplanation');
  const situationRaw = searchParams.get('situation');
  const explanationRaw = searchParams.get('explanation');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
  const sortRaw = searchParams.get('sort');
  const sort: 'asc' | 'desc' | 'errorRate' | 'mostUsed' =
    sortRaw === 'asc' || sortRaw === 'errorRate' || sortRaw === 'mostUsed' ? sortRaw : 'desc';
  const situation =
    situationRaw === 'correct' || situationRaw === 'wrong' || situationRaw === 'unanswered' ? situationRaw : undefined;
  const explanation = explanationRaw === 'with' || explanationRaw === 'without' ? explanationRaw : undefined;

  if (!['all', 'certification', 'public_exam'].includes(type)) {
    return NextResponse.json({ message: 'Invalid type filter' }, { status: 400 });
  }
  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1 || pageSize > 50) {
    return NextResponse.json(
      { message: 'page and pageSize must be valid positive integers (pageSize max 50)' },
      { status: 400 }
    );
  }

  const hasAnswer = hasAnswerRaw === 'true' ? true : hasAnswerRaw === 'false' ? false : undefined;
  const hasExplanation = hasExplanationRaw === 'true' ? true : hasExplanationRaw === 'false' ? false : undefined;

  try {
    const result = await service.getQuestions({
      userId: session.user.id,
      type: type as 'all' | 'certification' | 'public_exam',
      search,
      source,
      topic,
      difficulty,
      hasAnswer,
      hasExplanation,
      situation,
      explanation,
      sort,
      page,
      pageSize,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error('question-bank GET error:', err);
    return NextResponse.json(
      { error: err, message: e.message || 'Failed to load questions' },
      { status: e.status || 500 }
    );
  }
}
