import { prisma } from '@/lib/prisma';
import { CreateMockExamPayload, MockExamSubjectConfig, AIPublicExamQuestion } from '@/shared/types';
import { normalizeName, looseKey } from '@/shared/utils';
import { OpenAIService } from '@/features/services/openAI.service';
import { PublicExamQuestionService } from '@/features/services/question.service';
import { publicExamAnswersPrompt } from '@/config/prompts/public-exam-answers.prompt';

const ANSWERS_BATCH_SIZE = 10;

export class MockExamService {
  private openAIServiceInstance: OpenAIService | null = null;
  private questionServiceInstance: PublicExamQuestionService | null = null;

  private get openAIService(): OpenAIService {
    this.openAIServiceInstance ??= new OpenAIService();

    return this.openAIServiceInstance;
  }

  private get questionService(): PublicExamQuestionService {
    this.questionServiceInstance ??= new PublicExamQuestionService();

    return this.questionServiceInstance;
  }

  async list(userId: string) {
    const mockExams = await prisma.mockExam.findMany({
      where: { userId },
      include: {
        publicExam: { include: { examBoard: true } },
        subjects: true,
        attempts: { orderBy: { startedAt: 'desc' } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return mockExams.map((m) => {
      const finishedAttempts = m.attempts
        .filter((a) => a.finishedAt !== null)
        .sort((a, b) => (b.finishedAt?.getTime() ?? 0) - (a.finishedAt?.getTime() ?? 0));
      const open = m.attempts.find((a) => a.finishedAt === null) ?? null;
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
        openAttemptId: open?.id ?? null,
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

  /**
   * Resolves each MockExamSubjectConfig.subjectName to the configured
   * PublicExamSubject row for this exam. Uses NFC + lowercase matching so
   * minor display drift (accents, whitespace, case) does not break the link.
   * Returns null subjectId when the name cannot be matched at all (caller
   * should treat as 0 questions available).
   */
  private async resolveSubjects(
    publicExamId: string,
    subjects: MockExamSubjectConfig[]
  ): Promise<Array<MockExamSubjectConfig & { subjectId: string | null }>> {
    const dbSubjects = await prisma.publicExamSubject.findMany({
      where: { publicExamId },
      select: { id: true, name: true },
    });
    const byKey = new Map<string, string>();

    for (const s of dbSubjects) byKey.set(looseKey(s.name), s.id);

    return subjects.map((s) => ({
      ...s,
      subjectId: byKey.get(looseKey(s.subjectName)) ?? null,
    }));
  }

  async create(payload: CreateMockExamPayload, userId: string) {
    const { publicExamId, name, totalQuestions, subjects } = payload;

    const resolved = await this.resolveSubjects(publicExamId, subjects);

    await this.validateSubjectAvailability(publicExamId, resolved, userId);

    const publicExam = await prisma.publicExam.findFirst({ where: { id: publicExamId } });

    if (!publicExam) throw Object.assign(new Error('Concurso não encontrado'), { status: 404 });

    const autoName = name?.trim() || `${publicExam.name} – ${totalQuestions} questões`;

    const selectedQuestionIds = await this.drawQuestions(publicExamId, resolved, userId);

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

  private async validateSubjectAvailability(
    publicExamId: string,
    subjects: Array<MockExamSubjectConfig & { subjectId: string | null }>,
    userId: string
  ) {
    const publicExam = await prisma.publicExam.findFirst({ where: { id: publicExamId } });

    if (!publicExam) throw Object.assign(new Error('Concurso não encontrado'), { status: 404 });

    for (const s of subjects) {
      // Prefer FK match when available (post Layer 5 schema). Fall back to
      // the denormalized string match for any rows still without subjectId.
      const count = s.subjectId
        ? await prisma.publicExamQuestion.count({
            where: {
              userId,
              OR: [
                { subjectId: s.subjectId },
                {
                  subjectId: null,
                  publicExamName: publicExam.name,
                  subject: normalizeName(s.subjectName),
                },
              ],
            },
          })
        : await prisma.publicExamQuestion.count({
            where: {
              publicExamName: publicExam.name,
              subject: normalizeName(s.subjectName),
              userId,
            },
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
    subjects: Array<MockExamSubjectConfig & { subjectId: string | null }>,
    userId: string
  ): Promise<number[]> {
    const publicExam = await prisma.publicExam.findFirstOrThrow({ where: { id: publicExamId } });
    const ids: number[] = [];

    for (const s of subjects) {
      const questions = s.subjectId
        ? await prisma.publicExamQuestion.findMany({
            where: {
              userId,
              OR: [
                { subjectId: s.subjectId },
                {
                  subjectId: null,
                  publicExamName: publicExam.name,
                  subject: normalizeName(s.subjectName),
                },
              ],
            },
            select: { id: true },
          })
        : await prisma.publicExamQuestion.findMany({
            where: { publicExamName: publicExam.name, subject: normalizeName(s.subjectName), userId },
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

    const open = await prisma.mockExamAttempt.findFirst({
      where: { mockExamId, userId, finishedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (open) return open;

    const attempt = await prisma.mockExamAttempt.create({
      data: { mockExamId, userId },
    });

    return attempt;
  }

  /**
   * Generates and persists PublicExamAnswer rows for any question in this
   * mock exam that still lacks one. Idempotent — questions that already have
   * an answer are skipped. Used by the frontend before starting an attempt so
   * the result page always has a gabarito to compare against.
   */
  async ensureAnswers(mockExamId: number, userId: string) {
    const mockExam = await prisma.mockExam.findFirst({
      where: { id: mockExamId, userId },
      include: {
        publicExam: { include: { examBoard: true } },
        questions: {
          include: {
            publicExamQuestion: { include: { options: true, answer: true } },
          },
        },
      },
    });

    if (!mockExam) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });

    const missing = mockExam.questions.map((mq) => mq.publicExamQuestion).filter((q) => !q.answer);

    if (missing.length === 0) return { generated: 0 };

    type MissingQuestion = (typeof missing)[number];
    // Group by subject so each LLM call has consistent context.
    const bySubject = new Map<string, MissingQuestion[]>();

    for (const q of missing) {
      const list = bySubject.get(q.subject) ?? [];

      list.push(q);
      bySubject.set(q.subject, list);
    }

    let totalGenerated = 0;

    for (const [subject, subjectQuestions] of Array.from(bySubject.entries())) {
      for (let i = 0; i < subjectQuestions.length; i += ANSWERS_BATCH_SIZE) {
        const slice = subjectQuestions.slice(i, i + ANSWERS_BATCH_SIZE);
        const payload: AIPublicExamQuestion[] = slice.map((q: MissingQuestion) => ({
          id: q.id,
          publicExamName: q.publicExamName,
          examBoardName: q.examBoardName,
          subject: q.subject,
          topic: q.topic ?? undefined,
          text: q.text,
          correctCount: q.correctCount,
          difficulty: q.difficulty,
          options: Object.fromEntries(q.options.map((o: { label: string; text: string }) => [o.label, o.text])),
        }));

        const llmResponse = await this.openAIService.call(publicExamAnswersPrompt, {
          public_exam_name: mockExam.publicExam.name,
          exam_board_name: mockExam.publicExam.examBoard?.name ?? '',
          role: mockExam.publicExam.role ?? undefined,
          subject_name: subject,
          topic_name: slice[0]?.topic ?? undefined,
          questions: payload,
        });

        const parsed = JSON.parse(llmResponse) as {
          answers?: { questionId: number; correctOptions: string[] }[];
        };

        if (Array.isArray(parsed?.answers)) {
          await this.questionService.saveAnswers(
            parsed.answers.map((a) => ({
              questionId: a.questionId,
              correctOptions: a.correctOptions,
              explanations: {},
            }))
          );
          totalGenerated += parsed.answers.length;
        }
      }
    }

    return { generated: totalGenerated };
  }

  async finishAttempt(
    mockExamId: number,
    attemptId: number,
    userId: string,
    answers: { mockExamQuestionId: number; selectedOptions: string[] }[]
  ) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id: attemptId, mockExamId, userId },
    });

    if (!attempt) throw Object.assign(new Error('Tentativa não encontrada'), { status: 404 });

    const mockExamQuestions = await prisma.mockExamQuestion.findMany({
      where: { mockExamId },
      include: { publicExamQuestion: { include: { answer: true } } },
    });

    const answersMap = new Map(answers.map((a) => [a.mockExamQuestionId, a.selectedOptions]));
    let score = 0;

    for (const mq of mockExamQuestions) {
      const correctOptions: string[] = mq.publicExamQuestion.answer
        ? (mq.publicExamQuestion.answer.correctOptions as unknown as string[])
        : [];
      const selected = answersMap.get(mq.id) ?? [];
      const isCorrect =
        correctOptions.length > 0 &&
        selected.length === correctOptions.length &&
        selected.every((s) => correctOptions.includes(s));

      if (isCorrect) score += 1;
    }

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

  async discardAttempt(mockExamId: number, attemptId: number, userId: string) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id: attemptId, mockExamId, userId },
    });

    if (!attempt) throw Object.assign(new Error('Tentativa não encontrada'), { status: 404 });
    if (attempt.finishedAt !== null) {
      throw Object.assign(new Error('Tentativa já finalizada'), { status: 409 });
    }
    await prisma.mockExamAttempt.delete({ where: { id: attemptId } });
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
