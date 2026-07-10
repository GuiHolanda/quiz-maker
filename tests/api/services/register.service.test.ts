import { vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));

vi.mock('@/features/services/email.service', () => {
  const EmailService = vi.fn();

  EmailService.prototype.sendEmailVerification = vi.fn().mockResolvedValue(undefined);

  return { EmailService };
});

import bcrypt from 'bcryptjs';
import { prismaMock } from '../__mocks__/prisma';
import { RegisterService } from '@/app/api/auth/register/register.service';

describe('RegisterService', () => {
  let service: RegisterService;

  beforeEach(() => {
    service = new RegisterService();
    prismaMock.verificationToken.deleteMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.verificationToken.create.mockResolvedValue({} as any);
  });

  // Behaviour 1: missing email throws 400
  it('throws 400 when email is missing', async () => {
    await expect(service.register({ password: 'pass1234' })).rejects.toMatchObject({ status: 400 });
  });

  // Behaviour 2: password too short throws 400
  it('throws 400 when password is shorter than 8 characters', async () => {
    await expect(service.register({ email: 'a@b.com', password: 'short' })).rejects.toMatchObject({
      status: 400,
    });
  });

  // Behaviour 3: duplicate verified email returns success with redirectToVerify: false
  it('returns redirectToVerify: false when a verified user with the same email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
      emailVerified: new Date(),
    } as any);

    const result = await service.register({ email: 'test@example.com', password: 'pass1234' });

    expect(result).toMatchObject({ id: 'existing-user', email: 'test@example.com', redirectToVerify: false });
  });

  // Behaviour 3b: duplicate unverified email resends code and returns redirectToVerify: true
  it('resends verification code and returns redirectToVerify: true when email exists but is unverified', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
      emailVerified: null,
    } as any);

    const result = await service.register({ email: 'test@example.com', password: 'pass1234' });

    expect(result).toMatchObject({ id: 'existing-user', redirectToVerify: true });
    expect(prismaMock.verificationToken.create).toHaveBeenCalledOnce();
  });

  // Behaviour 4: password is hashed before storing
  it('stores the bcrypt hash, not the plain-text password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'test@example.com' } as any);

    await service.register({ email: 'test@example.com', password: 'plainpassword' });

    expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 12);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed-password' }),
      }),
    );
  });

  // Behaviour 5: returns { id, email, redirectToVerify } on success
  it('returns { id, email, redirectToVerify: true } on successful registration', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'test@example.com' } as any);

    const result = await service.register({ email: 'test@example.com', password: 'plainpassword' });

    expect(result).toEqual({ id: 'u1', email: 'test@example.com', redirectToVerify: true });
  });
});
