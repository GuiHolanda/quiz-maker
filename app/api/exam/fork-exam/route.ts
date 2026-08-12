import { NextRequest, NextResponse } from 'next/server';

import { ExamCatalogService } from '@/features/services/exam-catalog.service';
import { QuotaService } from '@/features/services/quota.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

const catalogService = new ExamCatalogService();
const quotaService = new QuotaService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await quotaService.check(session.user.id, 'create_exam', 1);

    const body = await request.json();
    const templateId = typeof body?.templateId === 'string' ? body.templateId : null;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const forked = await catalogService.forkExam(templateId, session.user.id);

    await quotaService.record(session.user.id, 'create_exam', 1);

    return NextResponse.json({ exam: forked }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to fork exam:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
