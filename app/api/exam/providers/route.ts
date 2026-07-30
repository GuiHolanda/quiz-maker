import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const records = await prisma.provider.findMany({ orderBy: { name: 'asc' } });
    const providers = records.map(({ id, name, fullName, logoUrl }) => ({
      id,
      name,
      fullName: fullName ?? undefined,
      logoUrl: logoUrl ?? undefined,
    }));

    return NextResponse.json({ providers });
  } catch (err: unknown) {
    console.error('Failed to fetch providers:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const { name, fullName } = (body ?? {}) as Record<string, unknown>;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedFullName = typeof fullName === 'string' && fullName.trim() ? fullName.trim() : null;

    const provider = await prisma.provider.upsert({
      where: { name: trimmedName },
      update: trimmedFullName ? { fullName: trimmedFullName } : {},
      create: { name: trimmedName, fullName: trimmedFullName },
    });

    return NextResponse.json(
      {
        message: 'Provider saved successfully',
        provider: { id: provider.id, name: provider.name, fullName: provider.fullName ?? undefined },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Failed to save provider:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
