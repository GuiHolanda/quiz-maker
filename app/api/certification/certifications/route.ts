import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
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

    const certifications = records.map(({ label, key, topics }) => ({
      label,
      key,
      topics: topics.map(({ id, name, minQuestions, maxQuestions }) => ({ id, name, minQuestions, maxQuestions })),
    }));

    return NextResponse.json({ certifications });
  } catch (err) {
    console.error('Failed to fetch certifications:', err);

    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}
