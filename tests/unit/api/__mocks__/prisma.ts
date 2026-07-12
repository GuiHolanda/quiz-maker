import { mockDeep, mockReset } from 'vitest-mock-extended';
import { beforeEach, vi } from 'vitest';
import type { PrismaService } from '@/lib/prisma';

export const prismaMock = mockDeep<PrismaService>();

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
