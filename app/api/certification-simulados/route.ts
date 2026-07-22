import { NextRequest, NextResponse } from 'next/server';

import { CertificationSimuladosService } from './certification-simulados.service';

import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new CertificationSimuladosService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const simulados = await service.list(session.user.id);

    return NextResponse.json({ simulados });
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const simulado = await service.create(body, session.user.id);

    return NextResponse.json({ simulado }, { status: 201 });
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number(request.nextUrl.searchParams.get('id'));

  if (!id) return NextResponse.json({ error: 'Bad Request', message: 'id is required' }, { status: 400 });

  try {
    await service.delete(id, session.user.id);

    return NextResponse.json({ message: 'Deleted' });
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}
