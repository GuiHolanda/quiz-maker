import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.test') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' } },
});

async function globalTeardown() {
  const email = process.env.E2E_USER_EMAIL;
  if (!email) return;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  const userId = user.id;

  // Delete in dependency order
  await prisma.certificationSimuladoAttemptAnswer.deleteMany({
    where: { attempt: { userId } },
  });
  await prisma.certificationSimuladoAttempt.deleteMany({ where: { userId } });
  await prisma.certificationSimuladoQuestion.deleteMany({
    where: { simulado: { userId } },
  });
  await prisma.certificationSimuladoTopicConfig.deleteMany({
    where: { simulado: { userId } },
  });
  await prisma.certificationSimulado.deleteMany({ where: { userId } });

  await prisma.mockExamAttemptAnswer.deleteMany({
    where: { attempt: { userId } },
  });
  await prisma.mockExamAttempt.deleteMany({ where: { userId } });
  await prisma.mockExamQuestion.deleteMany({ where: { mockExam: { userId } } });
  await prisma.mockExamSubjectConfig.deleteMany({
    where: { mockExam: { userId } },
  });
  await prisma.mockExam.deleteMany({ where: { userId } });

  await prisma.explanation.deleteMany({ where: { answer: { question: { userId } } } });
  await prisma.answer.deleteMany({ where: { question: { userId } } });
  await prisma.option.deleteMany({ where: { question: { userId } } });
  await prisma.question.deleteMany({ where: { userId } });

  await prisma.certificationTopic.deleteMany({
    where: { certification: { userId } },
  });
  await prisma.certification.deleteMany({ where: { userId } });

  await prisma.publicExamExplanation.deleteMany({ where: { answer: { question: { userId } } } });
  await prisma.publicExamAnswer.deleteMany({ where: { question: { userId } } });
  await prisma.publicExamOption.deleteMany({ where: { question: { userId } } });
  await prisma.publicExamQuestion.deleteMany({ where: { userId } });
  await prisma.publicExamTopic.deleteMany({ where: { subject: { publicExam: { userId } } } });
  await prisma.publicExamSubject.deleteMany({ where: { publicExam: { userId } } });
  await prisma.publicExam.deleteMany({ where: { userId } });

  await prisma.$disconnect();
}

export default globalTeardown;
