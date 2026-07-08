import { prisma } from '@/lib/prisma';

export class VerifyEmailService {
  async verifyEmail(body: unknown): Promise<void> {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { email, code } = body as Record<string, unknown>;

    if (!email || typeof email !== 'string') {
      throw Object.assign(new Error('Email is required'), { status: 400 });
    }
    if (!code || typeof code !== 'string') {
      throw Object.assign(new Error('Código inválido'), { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const identifier = `email-verify:${normalizedEmail}`;

    const record = await prisma.verificationToken.findFirst({ where: { identifier } });

    if (!record) {
      throw Object.assign(new Error('Código inválido'), { status: 400 });
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      throw Object.assign(new Error('Código expirado. Solicite um novo.'), { status: 400 });
    }

    if (record.token !== code) {
      throw Object.assign(new Error('Código inválido'), { status: 400 });
    }

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.deleteMany({ where: { identifier } });
  }
}
