import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

export class ResetPasswordService {
  async resetPassword(body: unknown): Promise<void> {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { token, password } = body as Record<string, unknown>;

    if (!token || typeof token !== 'string') {
      throw Object.assign(new Error('Token is required'), { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record) {
      throw Object.assign(new Error('Invalid or expired reset link'), { status: 400 });
    }
    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      throw Object.assign(new Error('This reset link has expired'), { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: record.identifier },
      data: { password: hashed },
    });

    await prisma.verificationToken.delete({ where: { token } });
  }
}
