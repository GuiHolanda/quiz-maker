import { NextRequest, NextResponse } from 'next/server';

import { MockExamService } from '../../mock-exam.service';

import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

export const maxDuration = 300;

const service = new MockExamService();

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const result = await service.ensureAnswers(Number(id), session.user.id);

    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error('mock-exams/[id]/answers failed:', e);
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}
