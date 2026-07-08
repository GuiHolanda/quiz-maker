import { NextRequest, NextResponse } from 'next/server';

import { VerifyEmailService } from './verify-email.service';

const service = new VerifyEmailService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await service.verifyEmail(body);

    return NextResponse.json({ message: 'Email verificado com sucesso' });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };

    return NextResponse.json(
      { error: 'verify_email_failed', message: e.message ?? 'Something went wrong' },
      { status: e.status ?? 500 },
    );
  }
}
