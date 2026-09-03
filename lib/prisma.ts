import { PrismaClient, type Prisma } from '@prisma/client';

const LOG_LEVELS: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'];

export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: LOG_LEVELS,
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

  var __prismaService: PrismaService | undefined;
}

export const prisma = global.__prismaService ?? new PrismaService();

if (process.env.NODE_ENV === 'development') global.__prismaService = prisma;
