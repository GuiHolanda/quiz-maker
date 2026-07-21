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
    const [certTopics, examTopics] = await Promise.all([
      type === 'all' || type === 'certification'
        ? prisma.question.groupBy({
            by: ['topic'],
            where: { userId },
            orderBy: { topic: 'asc' },
          }).then((rows) => rows.map((r) => r.topic))
        : Promise.resolve([] as string[]),
      type === 'all' || type === 'public_exam'
        ? prisma.publicExamQuestion.groupBy({
            by: ['subject'],
            where: { userId },
            orderBy: { subject: 'asc' },
          }).then((rows) => rows.map((r) => r.subject))
        : Promise.resolve([] as string[]),
    ]);

    const topics = Array.from(new Set([...certTopics, ...examTopics])).sort();

    return NextResponse.json({ topics }, { status: 200 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error('question-bank/topics GET error:', err);
    return NextResponse.json(
      { error: err, message: e.message || 'Failed to load topics' },
      { status: e.status || 500 },
    );
  }
}
