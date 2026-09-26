import { NextRequest, NextResponse } from 'next/server';

import { BillingService } from '@/features/services/billing/billing.service';
import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const billingService = new BillingService();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checkoutSessionId = request.nextUrl.searchParams.get('session_id');

    if (!checkoutSessionId) {
      throw Object.assign(new Error('session_id is required'), { status: 400 });
    }

    const processed = await billingService.isCheckoutProcessed(session.user.id, checkoutSessionId);

    return NextResponse.json({ processed }, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to read checkout status:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
