import { NextResponse } from 'next/server';

import { DashboardService } from './dashboard.service';

import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new DashboardService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stats = await service.getStats(session.user.id);
    return NextResponse.json(stats);
  } catch (err: unknown) {
    console.error('Failed to fetch dashboard stats:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
