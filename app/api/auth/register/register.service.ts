import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/features/services/email.service';

export class RegisterService {
  async register(body: unknown): Promise<{ id: string; email: string }> {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { name, email, password } = body as Record<string, unknown>;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw Object.assign(new Error('Valid email is required'), { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      throw Object.assign(new Error('An account with this email already exists'), { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: typeof name === 'string' ? name.trim() : null,
        email: normalizedEmail,
        password: hashed,
      },
    });

    const code = String(Math.floor(Math.random() * 900000) + 100000);
    const identifier = `email-verify:${normalizedEmail}`;
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({ data: { identifier, token: code, expires } });

    await new EmailService().sendEmailVerification(normalizedEmail, code);

    return { id: user.id, email: user.email };
  }
}
