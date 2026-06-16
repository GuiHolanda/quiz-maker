import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { AIPublicExamQuestion } from '@/shared/types';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const questions: AIPublicExamQuestion[] = await request.json();
    if (!questions?.length) return NextResponse.json({ message: 'No questions', count: 0 });

    const questionIds = questions.map((q) => q.id) as number[];

    const existing = await prisma.publicExamAnswer.findMany({
      where: { questionId: { in: questionIds } },
      select: { questionId: true },
    });
    const existingIds = new Set(existing.map((a) => a.questionId));
    const needsAnswer = questions.filter((q) => !existingIds.has(q.id as unknown as number));

    if (!needsAnswer.length) return NextResponse.json({ message: 'All answers already exist', count: 0 });

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const cookieHeader = request.headers.get('cookie') ?? '';

    await fetch(`${baseUrl}/api/public-exam/get-answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
      body: JSON.stringify(needsAnswer),
    });

    return NextResponse.json({ message: 'Answers generated', count: needsAnswer.length });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: 'Internal Server Error', message: (e as Error).message }, { status });
  }
}
