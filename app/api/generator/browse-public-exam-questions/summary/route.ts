import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PublicExamBrowseSummaryService } from './public-exam-browse-summary.service';

const service = new PublicExamBrowseSummaryService();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await service.getSummary(session.user.id);
    return NextResponse.json(summary, { status: 200 });
  } catch (err: any) {
    console.error('public-exam browse-summary error:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to load summary' },
      { status: 500 },
    );
  }
}
