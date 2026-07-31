import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/features/services/email.service';

export class RegisterService {
  async register(body: unknown): Promise<{ id: string; email: string; redirectToVerify: boolean }> {
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

    // Hash early so the event loop isn't blocked right before the Resend HTTP call,
    // which can cause TCP connection failures on cold-start Lambdas.
    const hashed = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      if (!existing.emailVerified) {
        const code = String(Math.floor(Math.random() * 900000) + 100000);
        const identifier = `email-verify:${normalizedEmail}`;
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.verificationToken.deleteMany({ where: { identifier } });
        await prisma.verificationToken.create({ data: { identifier, token: code, expires } });

        // Update password in case user re-registers with a different password before verifying.
        await prisma.user.update({ where: { email: normalizedEmail }, data: { password: hashed } });

        console.log('[RegisterService] re-sending verification email to existing unverified:', normalizedEmail);
        await new EmailService().sendEmailVerification(normalizedEmail, code);
        console.log('[RegisterService] re-send successful');

        return { id: existing.id, email: existing.email, redirectToVerify: true as const };
      }

      // Return success-shaped response for verified existing accounts too, to
      // prevent callers from distinguishing registered vs. unregistered emails.
      return { id: existing.id, email: existing.email, redirectToVerify: false as const };
    }

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

    console.log('[RegisterService] sending verification email to:', normalizedEmail);
    await new EmailService().sendEmailVerification(normalizedEmail, code);
    console.log('[RegisterService] verification email sent successfully');

    return { id: user.id, email: user.email, redirectToVerify: true as const };
  }
}
