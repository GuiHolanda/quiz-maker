import { NextResponse } from 'next/server';

import { BillingService } from '@/features/services/billing.service';
import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const billingService = new BillingService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const details = await billingService.getBillingDetails(session.user.id);

    return NextResponse.json(details, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to fetch billing details:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
