import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

declare global {
  // store global reference in dev to prevent exhausting connections
  // eslint-disable-next-line no-var
  var __prismaService: PrismaService | undefined;
}

export const prisma = global.__prismaService ?? new PrismaService();

if (process.env.NODE_ENV === 'development') global.__prismaService = prisma;
