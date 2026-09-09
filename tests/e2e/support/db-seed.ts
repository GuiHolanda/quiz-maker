import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { E2E_CERT_LABEL, E2E_CERT_TOPIC } from './constants';

dotenv.config({ path: path.join(process.cwd(), '.env.test') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

const SEED_QUESTION_OPTIONS = { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' };

export async function seedCertQuestions(texts: string[]): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' } },
  });

  try {
    const email = process.env.E2E_USER_EMAIL;
    if (!email) throw new Error('E2E_USER_EMAIL is not set');

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`E2E user not found: ${email}`);

    for (const text of texts) {
      await prisma.examQuestion.create({
        data: {
          text,
          correctCount: 1,
          difficulty: 'medium',
          examName: E2E_CERT_LABEL,
          sectionName: E2E_CERT_TOPIC,
          userId: user.id,
          options: {
            create: Object.entries(SEED_QUESTION_OPTIONS).map(([label, optionText]) => ({ label, text: optionText })),
          },
          answer: { create: { correctOptions: JSON.stringify(['A']) } },
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
