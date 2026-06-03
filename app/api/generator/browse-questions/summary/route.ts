import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { BrowseSummaryService } from './browse-summary.service';

const service = new BrowseSummaryService();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await service.getSummary(session.user.id);
    return NextResponse.json(summary, { status: 200 });
  } catch (err: any) {
    console.error('browse-summary error:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to load summary' },
      { status: 500 },
    );
  }
}
