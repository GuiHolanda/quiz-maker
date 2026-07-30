import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { BrowseSummaryService } from '@/features/services/browse.service';
import { ExamType } from '@/shared/types';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new BrowseSummaryService();

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get('type');
    const type: ExamType | undefined = rawType === 'certification' || rawType === 'public_exam' ? rawType : undefined;

    const summary = await service.getSummary(session.user.id, type);

    return NextResponse.json(summary, { status: 200 });
  } catch (err: unknown) {
    console.error('browse-summary error:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
