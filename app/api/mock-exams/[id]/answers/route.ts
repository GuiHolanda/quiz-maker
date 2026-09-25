import { NextRequest, NextResponse } from 'next/server';

import { MockExamService } from '../../mock-exam.service';

import { auth } from '@/auth';
import { logApiError, toApiErrorResponse } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

const service = new MockExamService();

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = { mockExamId: Number(id) };
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn('mock_exam.answers.unauthorized', context);

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = session.user.id;

    const result = await service.ensureAnswers(Number(id), userId);

    return NextResponse.json(result);
  } catch (e: unknown) {
    logApiError('mock_exam.answers.request_failed', e, { ...context, userId });
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}
