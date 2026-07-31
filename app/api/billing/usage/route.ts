import { NextResponse } from 'next/server';

import { QuotaService } from '@/features/services/quota.service';
import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const quotaService = new QuotaService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usage = await quotaService.getUsage(session.user.id);

    return NextResponse.json(usage, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to fetch billing usage:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
