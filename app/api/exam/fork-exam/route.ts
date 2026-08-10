import { NextRequest, NextResponse } from 'next/server';

import { ExamCatalogService } from '@/features/services/exam-catalog.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

const catalogService = new ExamCatalogService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const templateId = typeof body?.templateId === 'string' ? body.templateId : null;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const forkedId = await catalogService.forkExam(templateId, session.user.id);

    return NextResponse.json({ examId: forkedId }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to fork exam:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
