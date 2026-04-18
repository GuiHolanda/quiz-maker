import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.certification.findMany({ include: { topics: true } });

    const certifications = records.map(({ label, key, topics }) => ({
      label,
      key,
      topics: topics.map(({ name, minQuestions, maxQuestions }) => ({ name, minQuestions, maxQuestions })),
    }));

    return NextResponse.json({ certifications });
  } catch (err) {
    console.error('Failed to fetch certifications:', err);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}
