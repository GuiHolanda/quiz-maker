import { NextRequest, NextResponse } from 'next/server';

import { BillingService } from '@/features/services/billing.service';
import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const billingService = new BillingService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason : undefined;

    await billingService.cancelSubscription(session.user.id, reason);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to cancel subscription:', err);
    const { status, ...errorBody } = toApiErrorResponse(err);
    return NextResponse.json(errorBody, { status });
  }
}
