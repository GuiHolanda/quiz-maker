import { NextRequest, NextResponse } from 'next/server';

import { CertificationSimuladosService } from '../certification-simulados.service';

import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new CertificationSimuladosService();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const raw = await service.getById(Number(id), session.user.id);

    const shaped = {
      id: raw.id,
      name: raw.name,
      certKey: raw.certKey,
      certLabel: raw.certKey,
      topics: raw.topics.map((t) => ({ topicName: t.topicName, questionCount: t.questionCount })),
      questions: raw.questions.map((sq) => ({
        id: sq.id,
        order: sq.order,
        question: {
          id: sq.question.id,
          certificationTitle: sq.question.certificationTitle,
          text: sq.question.text,
          correctCount: sq.question.correctCount,
          topic: sq.question.topic,
          difficulty: sq.question.difficulty,
          options: Object.fromEntries(sq.question.options.map((o) => [o.label, o.text])),
          answer: sq.question.answer
            ? {
                questionId: sq.question.answer.questionId,
                correctOptions: sq.question.answer.correctOptions as unknown as string[],
                explanations: Object.fromEntries(sq.question.answer.explanations.map((e) => [e.label, e.text])),
              }
            : null,
          topicSubarea: sq.question.topicSubarea ?? undefined,
        },
      })),
    };

    return NextResponse.json({ simulado: shaped });
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}
