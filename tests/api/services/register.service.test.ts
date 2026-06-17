import { vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));

import bcrypt from 'bcryptjs';
import { prismaMock } from '../__mocks__/prisma';
import { RegisterService } from '@/app/api/auth/register/register.service';

describe('RegisterService', () => {
  let service: RegisterService;

  beforeEach(() => {
    service = new RegisterService();
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

  // Behaviour 3: duplicate email throws 409
  it('throws 409 when a user with the same email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
    } as any);

    await expect(
      service.register({ email: 'test@example.com', password: 'pass1234' }),
    ).rejects.toMatchObject({ status: 409 });
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

  // Behaviour 5: returns { id, email } on success
  it('returns { id, email } on successful registration', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'test@example.com' } as any);

    const result = await service.register({ email: 'test@example.com', password: 'plainpassword' });

    expect(result).toEqual({ id: 'u1', email: 'test@example.com' });
  });
});
