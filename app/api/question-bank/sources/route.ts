import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'all';
  const userId = session.user.id;

  try {
    const [certSources, examSources] = await Promise.all([
      type === 'all' || type === 'certification'
        ? prisma.question.groupBy({
            by: ['certificationTitle'],
            where: { userId },
            orderBy: { certificationTitle: 'asc' },
          }).then((rows) => rows.map((r) => r.certificationTitle))
        : Promise.resolve([] as string[]),
      type === 'all' || type === 'public_exam'
        ? prisma.publicExamQuestion.groupBy({
            by: ['publicExamName'],
            where: { userId },
            orderBy: { publicExamName: 'asc' },
          }).then((rows) => rows.map((r) => r.publicExamName))
        : Promise.resolve([] as string[]),
    ]);

    const sources = Array.from(new Set([...certSources, ...examSources])).sort();

    return NextResponse.json({ sources }, { status: 200 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error('question-bank/sources GET error:', err);
    return NextResponse.json(
      { error: err, message: e.message || 'Failed to load sources' },
      { status: e.status || 500 },
    );
  }
}
