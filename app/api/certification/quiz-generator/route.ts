import { NextRequest, NextResponse } from 'next/server';
import { QuizGeneratorService } from '@/features/services/quiz-generator.service';
import { prisma } from '@/lib/prisma';
import { INITIAL_CERTIFICATIONS_STATE } from '@/config/constants';
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

  const { certificationTitle, numQuestions } = parsed;

  try {
    let topics: { name: string; minQuestions: number; maxQuestions: number }[] | null = null;

    const dbCert = await prisma.certification.findFirst({
      where: { label: certificationTitle, userId: session.user.id },
      include: { topics: true },
    });

    if (dbCert) {
      topics = dbCert.topics;
    } else {
      const fallback = INITIAL_CERTIFICATIONS_STATE.certifications.find(
        (c) => c.label === certificationTitle
      );
      if (fallback) topics = fallback.topics;
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { message: `Certification not found: ${certificationTitle}` },
        { status: 400 }
      );
    }

    const allocation = service.distributeQuestions(topics, numQuestions);

    const perTopicResults = await Promise.all(
      Array.from(allocation.entries()).map(async ([topicName, count]) => {
        const questions = await service.fetchStoredQuestions(
          certificationTitle,
          [topicName],
          count,
          session.user.id
        );
        return { topicName, required: count, questions };
      })
    );

    const shortfalls = perTopicResults.filter((r) => r.questions.length < r.required);
    if (shortfalls.length > 0) {
      const details = shortfalls
        .map((r) => `'${r.topicName}' (need ${r.required}, found ${r.questions.length})`)
        .join(', ');
      return NextResponse.json(
        { message: `Insufficient questions for topics: ${details}` },
        { status: 400 }
      );
    }

    const all = perTopicResults.flatMap((r) => r.questions);
    return NextResponse.json(shuffleArray(all), { status: 200 });
  } catch (err: any) {
    console.error('quiz-generator error:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
