import { vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));

import bcrypt from 'bcryptjs';
import { prismaMock } from '../__mocks__/prisma';
import { ResetPasswordService } from '@/app/api/auth/reset-password/reset-password.service';

describe('ResetPasswordService', () => {
  let service: ResetPasswordService;

  beforeEach(() => {
    service = new ResetPasswordService();
  });

  // Behaviour 1: token not found throws 400
  it('throws 400 when token is not found', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(null);

    await expect(
      service.resetPassword({ token: 'bad-token', password: 'newpassword' }),
    ).rejects.toMatchObject({ status: 400, message: 'Invalid or expired reset link' });
  });

  // Behaviour 2: expired token throws 400 and deletes the token
  it('throws 400 and deletes the token when it has expired', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({
      token: 'reset-token-123',
      identifier: 'user@example.com',
      expires: new Date(Date.now() - 1000),
    });
    prismaMock.verificationToken.delete.mockResolvedValue({} as any);

    await expect(
      service.resetPassword({ token: 'reset-token-123', password: 'newpassword' }),
    ).rejects.toMatchObject({ status: 400, message: 'This reset link has expired' });

    expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'reset-token-123' },
    });
  });

  // Behaviours 3 & 4: success — updates password with hash and deletes the token
  it('updates the user password with the hashed value and deletes the token on success', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({
      token: 'reset-token-123',
      identifier: 'user@example.com',
      expires: new Date(Date.now() + 3_600_000),
    });
    prismaMock.user.update.mockResolvedValue({} as any);
    prismaMock.verificationToken.delete.mockResolvedValue({} as any);

    await service.resetPassword({ token: 'reset-token-123', password: 'newpassword' });

    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 12);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      data: { password: 'hashed-password' },
    });

    expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'reset-token-123' },
    });
  });
});
