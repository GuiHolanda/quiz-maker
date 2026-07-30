import type { PrismaClient } from '@prisma/client';

// FK-safe delete sequence for all data owned by a user.
// Shared by global-setup (pre-seed reset) and global-teardown (final cleanup).
export async function cleanupUserData(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.mockExamAttemptAnswer.deleteMany({ where: { attempt: { userId } } });
  await prisma.mockExamAttempt.deleteMany({ where: { userId } });
  await prisma.mockExamQuestion.deleteMany({ where: { mockExam: { userId } } });
  await prisma.mockExamSectionConfig.deleteMany({ where: { mockExam: { userId } } });
  await prisma.mockExam.deleteMany({ where: { userId } });

  await prisma.examExplanation.deleteMany({ where: { answer: { question: { userId } } } });
  await prisma.examAnswer.deleteMany({ where: { question: { userId } } });
  await prisma.examOption.deleteMany({ where: { question: { userId } } });
  await prisma.examQuestion.deleteMany({ where: { userId } });

  await prisma.examTopic.deleteMany({ where: { section: { exam: { userId } } } });
  await prisma.examSection.deleteMany({ where: { exam: { userId } } });
  await prisma.exam.deleteMany({ where: { userId } });

  await prisma.generationJobTopic.deleteMany({ where: { job: { userId } } });
  await prisma.generationJob.deleteMany({ where: { userId } });
}
