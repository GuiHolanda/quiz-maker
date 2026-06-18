import { NextRequest, NextResponse } from 'next/server';

import { CertificationSimuladosService } from '../../../certification-simulados.service';

import { auth } from '@/auth';

const service = new CertificationSimuladosService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, attemptId } = await params;

  try {
    const { answers, score } = await request.json();

    await service.finishAttempt(Number(id), Number(attemptId), session.user.id, answers, score);

    return NextResponse.json({ message: 'Attempt finished' });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;

    return NextResponse.json({ error: 'Internal Server Error', message: (e as Error).message }, { status });
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
    const status = (e as { status?: number }).status ?? 500;

    return NextResponse.json({ error: 'Internal Server Error', message: (e as Error).message }, { status });
  }
}
