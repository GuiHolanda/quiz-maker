import { NextRequest, NextResponse } from 'next/server';
import { ResetPasswordService } from './reset-password.service';

const resetPasswordService = new ResetPasswordService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    await resetPasswordService.resetPassword(body);
    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('Reset password failed:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Reset failed' },
      { status: err.status || 500 }
    );
  }
}
