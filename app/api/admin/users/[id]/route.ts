import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { UserPlan } from '@/shared/types';
import { AdminService } from '@/app/api/admin/admin.service';

const adminService = new AdminService();

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

  if (dbUser?.plan !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const { plan, customQuotaOverride } = (body ?? {}) as {
      plan?: UserPlan;
      customQuotaOverride?: number | null;
    };

    const validPlans: UserPlan[] = ['free', 'pro', 'pro_ai', 'tester', 'admin'];

    if (plan !== undefined && !validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan value' }, { status: 400 });
    }

    if (
      customQuotaOverride !== undefined &&
      customQuotaOverride !== null &&
      (typeof customQuotaOverride !== 'number' || (!Number.isInteger(customQuotaOverride)) || (customQuotaOverride < -1))
    ) {
      return NextResponse.json({ error: 'customQuotaOverride must be null, -1, or a positive integer' }, { status: 400 });
    }

    const updated = await adminService.updateUser(session.user.id, params.id, {
      ...(plan !== undefined ? { plan } : {}),
      ...(customQuotaOverride !== undefined ? { customQuotaOverride } : {}),
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: err.status || 500 });
  }
}
