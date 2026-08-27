import { NextRequest, NextResponse } from 'next/server';

import { MockExamService } from '../mock-exam.service';

import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new MockExamService();

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const examId = request.nextUrl.searchParams.get('examId');

  if (!examId) return NextResponse.json({ error: 'Bad Request', message: 'examId is required' }, { status: 400 });

  try {
    const availability = await service.availability(examId, session.user.id);

    return NextResponse.json(availability);
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}
