import { NextRequest, NextResponse } from 'next/server';

import { CertificationSimuladosService } from '../../certification-simulados.service';

import { auth } from '@/auth';

const service = new CertificationSimuladosService();

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const attempt = await service.startAttempt(Number(id), session.user.id);

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;

    return NextResponse.json({ error: 'Internal Server Error', message: (e as Error).message }, { status });
  }
}
