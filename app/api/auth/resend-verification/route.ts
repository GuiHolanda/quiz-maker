import { NextRequest, NextResponse } from 'next/server';

import { ResendVerificationService } from './resend-verification.service';

const service = new ResendVerificationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await service.resendCode(body);

    return NextResponse.json({ message: 'Código reenviado' });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };

    return NextResponse.json(
      { error: 'resend_failed', message: e.message ?? 'Something went wrong' },
      { status: e.status ?? 500 },
    );
  }
}
