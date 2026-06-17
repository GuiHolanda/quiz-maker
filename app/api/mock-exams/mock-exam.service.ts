import { prisma } from '@/lib/prisma';
import { CreateMockExamPayload, MockExamSubjectConfig } from '@/shared/types';

export class MockExamService {
  async list(userId: string) {
    const mockExams = await prisma.mockExam.findMany({
      where: { userId },
      include: {
        publicExam: { include: { examBoard: true } },
        subjects: true,
        attempts: { where: { finishedAt: { not: null } }, orderBy: { finishedAt: 'desc' } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return mockExams.map((m) => {
      const finishedAttempts = m.attempts;
      const bestScore = finishedAttempts.length > 0 ? Math.max(...finishedAttempts.map((a) => a.score ?? 0)) : null;
      const lastAttemptId = finishedAttempts.length > 0 ? finishedAttempts[0].id : null;

      return {
        id: m.id,
        name: m.name,
        publicExam: { id: m.publicExam.id, name: m.publicExam.name, examBoard: m.publicExam.examBoard },
        totalQuestions: m._count.questions,
        attemptCount: finishedAttempts.length,
        bestScore,
        lastAttemptId,
        attempts: finishedAttempts.map((a) => ({
          id: a.id,
          score: a.score,
          startedAt: a.startedAt.toISOString(),
          finishedAt: a.finishedAt?.toISOString() ?? null,
        })),
        createdAt: m.createdAt.toISOString(),
      };
    });
  }

  async create(payload: CreateMockExamPayload, userId: string) {
    const { publicExamId, name, totalQuestions, subjects } = payload;

    await this.validateSubjectAvailability(publicExamId, subjects, userId);

    const publicExam = await prisma.publicExam.findFirst({ where: { id: publicExamId } });

    if (!publicExam) throw Object.assign(new Error('Concurso não encontrado'), { status: 404 });

    const autoName = name?.trim() || `${publicExam.name} – ${totalQuestions} questões`;

    const selectedQuestionIds = await this.drawQuestions(publicExamId, subjects, userId);

    const mockExam = await prisma.mockExam.create({
      data: {
        name: autoName,
        publicExamId,
        userId,
        subjects: { create: subjects.map((s) => ({ subjectName: s.subjectName, questionCount: s.questionCount })) },
        questions: {
          create: selectedQuestionIds.map((id, index) => ({
            publicExamQuestionId: id,
            order: index,
          })),
        },
      },
      include: {
        publicExam: { include: { examBoard: true } },
        _count: { select: { questions: true } },
      },
    });

    return {
      id: mockExam.id,
      name: mockExam.name,
      publicExam: {
        id: mockExam.publicExam.id,
        name: mockExam.publicExam.name,
        examBoard: mockExam.publicExam.examBoard,
      },
      totalQuestions: mockExam._count.questions,
      attemptCount: 0,
      bestScore: null,
      lastAttemptId: null,
      createdAt: mockExam.createdAt.toISOString(),
    };
  }

  private async validateSubjectAvailability(publicExamId: string, subjects: MockExamSubjectConfig[], userId: string) {
    const publicExam = await prisma.publicExam.findFirst({ where: { id: publicExamId } });

    if (!publicExam) throw Object.assign(new Error('Concurso não encontrado'), { status: 404 });

    for (const s of subjects) {
      const count = await prisma.publicExamQuestion.count({
        where: { publicExamName: publicExam.name, subject: s.subjectName, userId },
      });

      if (count < s.questionCount) {
        throw Object.assign(
          new Error(
            `Questões insuficientes para a matéria "${s.subjectName}": ${count} disponíveis, ${s.questionCount} necessárias`
          ),
          { status: 422 }
        );
      }
    }
  }

  private async drawQuestions(
    publicExamId: string,
    subjects: MockExamSubjectConfig[],
    userId: string
  ): Promise<number[]> {
    const publicExam = await prisma.publicExam.findFirstOrThrow({ where: { id: publicExamId } });
    const ids: number[] = [];

    for (const s of subjects) {
      const questions = await prisma.publicExamQuestion.findMany({
        where: { publicExamName: publicExam.name, subject: s.subjectName, userId },
        select: { id: true },
      });

      const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, s.questionCount);

      ids.push(...shuffled.map((q) => q.id));
    }

    return ids;
  }

  async delete(id: number, userId: string) {
    const exam = await prisma.mockExam.findFirst({ where: { id, userId } });

    if (!exam) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });
    await prisma.mockExam.delete({ where: { id } });
  }

  async getById(id: number, userId: string) {
    const mockExam = await prisma.mockExam.findFirst({
      where: { id, userId },
      include: {
        publicExam: { include: { examBoard: true } },
        subjects: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            publicExamQuestion: {
              include: {
                options: true,
                answer: { include: { explanations: true } },
              },
            },
          },
        },
        attempts: { orderBy: { startedAt: 'desc' } },
      },
    });

    if (!mockExam) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });

    return mockExam;
  }

  async startAttempt(mockExamId: number, userId: string) {
    const exam = await prisma.mockExam.findFirst({ where: { id: mockExamId, userId } });

    if (!exam) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });

    const attempt = await prisma.mockExamAttempt.create({
      data: { mockExamId, userId },
    });

    return attempt;
  }

  async finishAttempt(
    mockExamId: number,
    attemptId: number,
    userId: string,
    answers: { mockExamQuestionId: number; selectedOptions: string[] }[],
    score: number
  ) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id: attemptId, mockExamId, userId },
    });

    if (!attempt) throw Object.assign(new Error('Tentativa não encontrada'), { status: 404 });

    await prisma.$transaction([
      prisma.mockExamAttemptAnswer.createMany({
        data: answers.map((a) => ({
          attemptId,
          mockExamQuestionId: a.mockExamQuestionId,
          selectedOptions: JSON.stringify(a.selectedOptions),
        })),
      }),
      prisma.mockExamAttempt.update({
        where: { id: attemptId },
        data: { finishedAt: new Date(), score },
      }),
    ]);
  }

  async getAttemptResult(mockExamId: number, attemptId: number, userId: string) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id: attemptId, mockExamId, userId },
      include: {
        answers: true,
        mockExam: {
          include: {
            publicExam: { include: { examBoard: true } },
            questions: {
              orderBy: { order: 'asc' },
              include: {
                publicExamQuestion: {
                  include: {
                    options: true,
                    answer: { include: { explanations: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) throw Object.assign(new Error('Tentativa não encontrada'), { status: 404 });

    const subjectMap = new Map<string, { correct: number; total: number }>();
    const answersMap = new Map(
      attempt.answers.map((a) => [a.mockExamQuestionId, JSON.parse(a.selectedOptions) as string[]])
    );

    for (const mq of attempt.mockExam.questions) {
      const subject = mq.publicExamQuestion.subject;
      const correctOptions: string[] = mq.publicExamQuestion.answer
        ? (mq.publicExamQuestion.answer.correctOptions as unknown as string[])
        : [];
      const selected = answersMap.get(mq.id) ?? [];
      const isCorrect =
        correctOptions.length > 0 &&
        selected.length === correctOptions.length &&
        selected.every((s) => correctOptions.includes(s));

      if (!subjectMap.has(subject)) subjectMap.set(subject, { correct: 0, total: 0 });
      const entry = subjectMap.get(subject)!;

      entry.total += 1;
      if (isCorrect) entry.correct += 1;
    }

    return {
      attempt: {
        id: attempt.id,
        mockExamId: attempt.mockExamId,
        startedAt: attempt.startedAt.toISOString(),
        finishedAt: attempt.finishedAt?.toISOString() ?? null,
        score: attempt.score,
        answers: attempt.answers.map((a) => ({
          mockExamQuestionId: a.mockExamQuestionId,
          selectedOptions: JSON.parse(a.selectedOptions) as string[],
        })),
      },
      mockExam: {
        id: attempt.mockExam.id,
        name: attempt.mockExam.name,
        publicExam: {
          id: attempt.mockExam.publicExam.id,
          name: attempt.mockExam.publicExam.name,
          examBoard: attempt.mockExam.publicExam.examBoard,
        },
      },
      questions: attempt.mockExam.questions.map((mq) => ({
        id: mq.id,
        order: mq.order,
        publicExamQuestion: {
          id: mq.publicExamQuestion.id,
          text: mq.publicExamQuestion.text,
          correctCount: mq.publicExamQuestion.correctCount,
          subject: mq.publicExamQuestion.subject,
          topic: mq.publicExamQuestion.topic,
          difficulty: mq.publicExamQuestion.difficulty,
          options: Object.fromEntries(mq.publicExamQuestion.options.map((o) => [o.label, o.text])),
          answer: mq.publicExamQuestion.answer
            ? {
                questionId: mq.publicExamQuestion.answer.questionId,
                correctOptions: mq.publicExamQuestion.answer.correctOptions as unknown as string[],
                explanations: Object.fromEntries(
                  mq.publicExamQuestion.answer.explanations.map((e) => [e.label, e.text])
                ),
              }
            : null,
          examBoardName: mq.publicExamQuestion.examBoardName,
          publicExamName: mq.publicExamQuestion.publicExamName,
        },
      })),
      subjectBreakdown: Array.from(subjectMap.entries()).map(([subjectName, v]) => ({
        subjectName,
        correct: v.correct,
        total: v.total,
      })),
    };
  }
}
