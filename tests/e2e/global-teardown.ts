import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { cleanupUserData } from './support/db-cleanup';

dotenv.config({ path: path.join(process.cwd(), '.env.test') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' } },
});

async function globalTeardown() {
  const email = process.env.E2E_USER_EMAIL;
  if (!email) return;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  await cleanupUserData(prisma, user.id);
  await prisma.$disconnect();
}

export default globalTeardown;
