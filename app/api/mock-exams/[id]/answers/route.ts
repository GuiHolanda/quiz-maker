import { NextRequest, NextResponse } from 'next/server';

import { MockExamService } from '../../mock-exam.service';

import { auth } from '@/auth';

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
    const err = e as Error & { status?: number };

    console.error('mock-exams/[id]/answers failed:', err);

    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message ?? 'Failed to generate answers' },
      { status: err.status ?? 500 }
    );
  }
}
