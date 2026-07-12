import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env.test') });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' } },
});

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL!;
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD!;

async function globalSetup(config: FullConfig) {
  if (!E2E_USER_EMAIL || !E2E_USER_PASSWORD) {
    throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test');
  }

  const hashedPassword = await bcrypt.hash(E2E_USER_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: E2E_USER_EMAIL },
    update: {
      password: hashedPassword,
      plan: 'tester',
      emailVerified: new Date(),
    },
    create: {
      email: E2E_USER_EMAIL,
      name: 'E2E Test User',
      password: hashedPassword,
      plan: 'tester',
      emailVerified: new Date(),
    },
  });

  await prisma.$disconnect();

  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.getByRole('textbox', { name: /email/i }).fill(E2E_USER_EMAIL);
  await page.getByLabel(/password/i).fill(E2E_USER_PASSWORD);
  await page.getByRole('button', { name: /sign in|login|entrar/i }).click();
  await page.waitForURL(`${baseURL}/dashboard`, { timeout: 15_000 });

  const storageStatePath = path.join(__dirname, 'auth/storageState.json');
  await page.context().storageState({ path: storageStatePath });
  await browser.close();
}

export default globalSetup;
