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
    const rows = await prisma.examQuestion.groupBy({
      by: ['examName'],
      where: { userId, ...(type !== 'all' && { exam: { type } }) },
      orderBy: { examName: 'asc' },
    });

    const sources = Array.from(new Set(rows.map((r) => r.examName))).sort();

    return NextResponse.json({ sources }, { status: 200 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error('question-bank/sources GET error:', err);
    return NextResponse.json(
      { error: err, message: e.message || 'Failed to load sources' },
      { status: e.status || 500 }
    );
  }
}
