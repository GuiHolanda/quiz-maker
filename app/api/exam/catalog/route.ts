import { NextResponse } from 'next/server';

import { ExamCatalogService } from '@/features/services/exam-catalog.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

const catalogService = new ExamCatalogService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await catalogService.getTemplates();

    return NextResponse.json({ templates });
  } catch (err: unknown) {
    console.error('Failed to fetch catalog:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
