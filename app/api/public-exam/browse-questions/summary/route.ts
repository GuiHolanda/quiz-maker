import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { PublicExamBrowseSummaryService } from '@/features/services/browse.service';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new PublicExamBrowseSummaryService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await service.getSummary(session.user.id);

    return NextResponse.json(summary, { status: 200 });
  } catch (err: unknown) {
    console.error('public-exam browse-summary error:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
