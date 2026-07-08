import { prisma } from '@/lib/prisma';
import { EmailService } from '@/features/services/email.service';

export class ResendVerificationService {
  async resendCode(body: unknown): Promise<void> {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { email } = body as Record<string, unknown>;

    if (!email || typeof email !== 'string') {
      throw Object.assign(new Error('Email is required'), { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Silently return to prevent user enumeration
    if (!user) return;

    const identifier = `email-verify:${normalizedEmail}`;
    const code = String(Math.floor(Math.random() * 900000) + 100000);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({ data: { identifier, token: code, expires } });

    await new EmailService().sendEmailVerification(normalizedEmail, code);
  }
}
