import type { PrismaClient } from '@prisma/client';

// FK-safe delete sequence for all data owned by a user.
// Shared by global-setup (pre-seed reset) and global-teardown (final cleanup).
export async function cleanupUserData(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.certificationSimuladoAttemptAnswer.deleteMany({ where: { attempt: { userId } } });
  await prisma.certificationSimuladoAttempt.deleteMany({ where: { userId } });
  await prisma.certificationSimuladoQuestion.deleteMany({ where: { simulado: { userId } } });
  await prisma.certificationSimuladoTopicConfig.deleteMany({ where: { simulado: { userId } } });
  await prisma.certificationSimulado.deleteMany({ where: { userId } });

  await prisma.mockExamAttemptAnswer.deleteMany({ where: { attempt: { userId } } });
  await prisma.mockExamAttempt.deleteMany({ where: { userId } });
  await prisma.mockExamQuestion.deleteMany({ where: { mockExam: { userId } } });
  await prisma.mockExamSubjectConfig.deleteMany({ where: { mockExam: { userId } } });
  await prisma.mockExam.deleteMany({ where: { userId } });

  await prisma.explanation.deleteMany({ where: { answer: { question: { userId } } } });
  await prisma.answer.deleteMany({ where: { question: { userId } } });
  await prisma.option.deleteMany({ where: { question: { userId } } });
  await prisma.question.deleteMany({ where: { userId } });

  await prisma.certificationTopic.deleteMany({ where: { certification: { userId } } });
  await prisma.certification.deleteMany({ where: { userId } });

  await prisma.publicExamExplanation.deleteMany({ where: { answer: { question: { userId } } } });
  await prisma.publicExamAnswer.deleteMany({ where: { question: { userId } } });
  await prisma.publicExamOption.deleteMany({ where: { question: { userId } } });
  await prisma.publicExamQuestion.deleteMany({ where: { userId } });
  await prisma.publicExamTopic.deleteMany({ where: { subject: { publicExam: { userId } } } });
  await prisma.publicExamSubject.deleteMany({ where: { publicExam: { userId } } });
  await prisma.publicExam.deleteMany({ where: { userId } });

  await prisma.generationJobTopic.deleteMany({ where: { job: { userId } } });
  await prisma.generationJob.deleteMany({ where: { userId } });
}
