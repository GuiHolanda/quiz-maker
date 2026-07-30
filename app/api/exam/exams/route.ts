import { NextResponse } from 'next/server';

import { ExamService } from '@/features/services/exam.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

const examService = new ExamService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const exams = await examService.getExams(session.user.id);

    return NextResponse.json({ exams });
  } catch (err: unknown) {
    console.error('Failed to fetch exams:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
