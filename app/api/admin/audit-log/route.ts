import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminService } from '@/app/api/admin/admin.service';

const adminService = new AdminService();

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

  if (dbUser?.plan !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const adminId = searchParams.get('adminId') ?? undefined;
  const targetId = searchParams.get('targetId') ?? undefined;

  try {
    const result = await adminService.getAuditLog({ page, limit, adminId, targetId });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
