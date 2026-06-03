import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const records = await prisma.examBoard.findMany({ orderBy: { name: 'asc' } });
    const examBoards = records.map(({ id, name, fullName }) => ({
      id,
      name,
      fullName: fullName ?? undefined,
    }));
    return NextResponse.json({ examBoards });
  } catch (err) {
    console.error('Failed to fetch exam boards:', err);
    return NextResponse.json({ error: 'Failed to fetch exam boards' }, { status: 500 });
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

    const examBoard = await prisma.examBoard.upsert({
      where: { name: trimmedName },
      update: trimmedFullName ? { fullName: trimmedFullName } : {},
      create: { name: trimmedName, fullName: trimmedFullName },
    });

    return NextResponse.json(
      {
        message: 'Exam board saved successfully',
        examBoard: { id: examBoard.id, name: examBoard.name, fullName: examBoard.fullName ?? undefined },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('Failed to save exam board:', err);
    return NextResponse.json({ error: err.message || 'Failed to save exam board' }, { status: err.status || 500 });
  }
}
