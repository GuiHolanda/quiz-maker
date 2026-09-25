import { NextRequest, NextResponse } from 'next/server';

import { MockExamService } from '../../../mock-exam.service';

import { auth } from '@/auth';
import { logApiError, toApiErrorResponse } from '@/lib/api-error';
import { logger, type LogFields } from '@/lib/logger';

const service = new MockExamService();

interface AttemptRouteContext {
  readonly params: Promise<{ id: string; attemptId: string }>;
}

function unauthorized(event: string, context: LogFields) {
  logger.warn(event, context);

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function failure(event: string, err: unknown, context: LogFields) {
  logApiError(event, err, context);
  const { status, ...body } = toApiErrorResponse(err);

  return NextResponse.json(body, { status });
}

export async function PATCH(request: NextRequest, { params }: AttemptRouteContext) {
  const { id, attemptId } = await params;
  const context = { mockExamId: Number(id), attemptId: Number(attemptId) };
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) return unauthorized('mock_exam.finish.unauthorized', context);
    userId = session.user.id;

    const { answers } = await request.json().catch(() => ({}));

    if (!Array.isArray(answers)) throw Object.assign(new Error('Respostas inválidas'), { status: 400 });

    await service.finishAttempt(Number(id), Number(attemptId), userId, answers);

    return NextResponse.json({ message: 'Attempt finished' });
  } catch (e: unknown) {
    return failure('mock_exam.finish.failed', e, { ...context, userId });
  }
}

export async function GET(_req: NextRequest, { params }: AttemptRouteContext) {
  const { id, attemptId } = await params;
  const context = { mockExamId: Number(id), attemptId: Number(attemptId) };
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) return unauthorized('mock_exam.result.unauthorized', context);
    userId = session.user.id;

    const result = await service.getAttemptResult(Number(id), Number(attemptId), userId);

    return NextResponse.json(result);
  } catch (e: unknown) {
    return failure('mock_exam.result.failed', e, { ...context, userId });
  }
}

export async function DELETE(_req: NextRequest, { params }: AttemptRouteContext) {
  const { id, attemptId } = await params;
  const context = { mockExamId: Number(id), attemptId: Number(attemptId) };
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) return unauthorized('mock_exam.discard.unauthorized', context);
    userId = session.user.id;

    await service.discardAttempt(Number(id), Number(attemptId), userId);

    return NextResponse.json({ message: 'Attempt discarded' });
  } catch (e: unknown) {
    return failure('mock_exam.discard.failed', e, { ...context, userId });
  }
}
