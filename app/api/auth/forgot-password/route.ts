import { NextRequest, NextResponse } from 'next/server';

import { ForgotPasswordService } from './forgot-password.service';

const forgotPasswordService = new ForgotPasswordService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    await forgotPasswordService.requestReset(body);

    return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err: any) {
    console.error('Forgot password failed:', err);

    return NextResponse.json({ error: err, message: err.message || 'Request failed' }, { status: err.status || 500 });
  }
}
