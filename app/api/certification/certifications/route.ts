import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const records = await prisma.certification.findMany({
      where: { userId: session.user.id },
      include: { topics: true },
    });

    const certifications = records.map(({ label, key, provider, totalQuestions, examDurationMinutes, passingScore, createdAt, updatedAt, topics }) => ({
      label,
      key,
      provider: provider ?? undefined,
      totalQuestions,
      examDurationMinutes: examDurationMinutes ?? undefined,
      passingScore: passingScore ?? undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      topics: topics.map(({ id, name, minQuestions, maxQuestions }) => ({ id, name, minQuestions, maxQuestions })),
    }));

    return NextResponse.json({ certifications });
  } catch (err: unknown) {
    console.error('Failed to fetch certifications:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
