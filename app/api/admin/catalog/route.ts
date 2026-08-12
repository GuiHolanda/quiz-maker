import { NextResponse } from 'next/server';

import { ExamCatalogService } from '@/features/services/exam-catalog.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const catalogService = new ExamCatalogService();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (dbUser?.plan !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const entries = await catalogService.getAdminCatalogEntries();

    return NextResponse.json({ entries });
  } catch (err: unknown) {
    console.error('Failed to fetch admin catalog:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
