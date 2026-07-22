import { NextRequest, NextResponse } from 'next/server';

import { CertificationSimuladosService } from '../../../certification-simulados.service';

import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new CertificationSimuladosService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, attemptId } = await params;

  try {
    const { answers } = await request.json();

    await service.finishAttempt(Number(id), Number(attemptId), session.user.id, answers);

    return NextResponse.json({ message: 'Attempt finished' });
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, attemptId } = await params;

  try {
    const result = await service.getAttemptResult(Number(id), Number(attemptId), session.user.id);

    return NextResponse.json(result);
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, attemptId } = await params;

  try {
    await service.discardAttempt(Number(id), Number(attemptId), session.user.id);

    return NextResponse.json({ message: 'Attempt discarded' });
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}
