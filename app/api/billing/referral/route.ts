import { NextResponse } from 'next/server';

import { ReferralService } from '@/features/services/referral.service';
import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const referralService = new ReferralService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await referralService.getStats(session.user.id);

    return NextResponse.json(stats, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to fetch referral stats:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
