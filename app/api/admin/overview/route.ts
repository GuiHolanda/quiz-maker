import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminService } from '@/app/api/admin/admin.service';

const adminService = new AdminService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

  if (dbUser?.plan !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const stats = await adminService.getOverview();

    return NextResponse.json(stats, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 });
  }
}
