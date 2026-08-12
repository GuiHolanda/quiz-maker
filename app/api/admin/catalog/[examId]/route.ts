import { NextRequest, NextResponse } from 'next/server';

import { ExamCatalogService } from '@/features/services/exam-catalog.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const catalogService = new ExamCatalogService();

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  return dbUser?.plan === 'admin' ? session : null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { examId } = await params;

  try {
    const detail = await catalogService.getAdminExamDetail(examId);
    return NextResponse.json(detail);
  } catch (err: unknown) {
    console.error('Failed to get exam detail:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { examId } = await params;

  try {
    await catalogService.promoteExam(examId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to promote exam:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
