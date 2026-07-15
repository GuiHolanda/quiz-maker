import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { USD_TO_BRL_FALLBACK } from '@/config/constants';

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
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const rate = parseFloat(data?.USDBRL?.bid);

    return NextResponse.json({ rate: isNaN(rate) ? USD_TO_BRL_FALLBACK : rate });
  } catch {
    return NextResponse.json({ rate: USD_TO_BRL_FALLBACK });
  }
}
