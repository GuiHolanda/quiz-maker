import { randomBytes } from 'crypto';

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/features/services/email.service';

export class ForgotPasswordService {
  async requestReset(body: unknown): Promise<void> {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { email } = body as Record<string, unknown>;

    if (!email || typeof email !== 'string') {
      throw Object.assign(new Error('Email is required'), { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always respond with success to prevent user enumeration
    if (!user) return;

    // Remove any existing token for this user
    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: { identifier: normalizedEmail, token, expires },
    });

    const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;

    await new EmailService().sendPasswordReset(normalizedEmail, resetUrl);
  }
}
