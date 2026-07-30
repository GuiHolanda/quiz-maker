import { NextRequest, NextResponse } from 'next/server';

import { QuizGeneratorService } from '@/features/services/quiz-generator.service';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

const service = new QuizGeneratorService();

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = service.parseParams(new URL(request.url));

  if ('error' in parsed) {
    return NextResponse.json({ message: parsed.error }, { status: 400 });
  }

  const { examName, numQuestions } = parsed;

  try {
    const dbExam = await prisma.exam.findFirst({
      where: { name: examName, userId: session.user.id },
      include: { sections: true },
    });

    const sections = dbExam?.sections ?? null;

    if (!sections || sections.length === 0) {
      return NextResponse.json({ message: `Exam not found: ${examName}` }, { status: 400 });
    }

    const allocation = service.distributeQuestions(sections, numQuestions);

    const perSectionResults = await Promise.all(
      Array.from(allocation.entries()).map(async ([sectionName, count]) => {
        const questions = await service.fetchStoredQuestions(examName, [sectionName], count, session.user.id);

        return { sectionName, required: count, questions };
      })
    );

    const shortfalls = perSectionResults.filter((r) => r.questions.length < r.required);

    if (shortfalls.length > 0) {
      const details = shortfalls
        .map((r) => `'${r.sectionName}' (need ${r.required}, found ${r.questions.length})`)
        .join(', ');

      return NextResponse.json({ message: `Insufficient questions for sections: ${details}` }, { status: 400 });
    }

    const all = perSectionResults.flatMap((r) => r.questions);

    return NextResponse.json(shuffleArray(all), { status: 200 });
  } catch (err: unknown) {
    console.error('quiz-generator error:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
