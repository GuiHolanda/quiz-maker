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
    const records = await prisma.publicExam.findMany({
      where: { userId: session.user.id },
      include: {
        examBoard: true,
        subjects: { include: { topics: true } },
      },
    });

    const publicExams = records.map(({ id, name, role, year, totalQuestions, examDurationMinutes, passingScore, examBoard, subjects }) => ({
      id,
      name,
      role: role ?? undefined,
      year: year ?? undefined,
      totalQuestions,
      examDurationMinutes: examDurationMinutes ?? undefined,
      passingScore: passingScore ?? undefined,
      examBoard: { id: examBoard.id, name: examBoard.name, fullName: examBoard.fullName ?? undefined },
      subjects: subjects.map(({ id: sid, name: sname, minQuestions, maxQuestions, topics }) => ({
        id: sid,
        name: sname,
        minQuestions,
        maxQuestions,
        topics: topics.map(({ id: tid, name: tname }) => ({ id: tid, name: tname })),
      })),
    }));

    return NextResponse.json({ publicExams });
  } catch (err: unknown) {
    console.error('Failed to fetch public exams:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
