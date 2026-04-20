import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw Object.assign(new Error('An account with this email already exists'), { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: typeof name === 'string' ? name.trim() : null,
        email: email.toLowerCase(),
        password: hashed,
      },
    });

    return { id: user.id, email: user.email };
  }
}
