import { NextRequest, NextResponse } from 'next/server';

import { RegisterService } from './register.service';

const registerService = new RegisterService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const user = await registerService.register(body);

    return NextResponse.json({ message: 'Account created successfully', userId: user.id }, { status: 201 });
  } catch (err: any) {
    console.error('Registration failed:', err);

    return NextResponse.json(
      { error: err, message: err.message || 'Registration failed' },
      { status: err.status || 500 }
    );
  }
}
