import { prisma } from '@/lib/prisma';
import { CreateCertSimuladoPayload, CertSimuladoTopicConfig } from '@/shared/types';

export class CertificationSimuladosService {
  async list(userId: string) {
    const simulados = await prisma.certificationSimulado.findMany({
      where: { userId },
      include: {
        topics: true,
        attempts: { where: { finishedAt: { not: null } }, orderBy: { finishedAt: 'desc' } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return simulados.map((s) => {
      const finished = s.attempts;
      const bestScore = finished.length > 0 ? Math.max(...finished.map((a) => a.score ?? 0)) : null;
      const lastAttemptId = finished.length > 0 ? finished[0].id : null;

      return {
        id: s.id,
        name: s.name,
        certKey: s.certKey,
        certLabel: s.certKey,
        totalQuestions: s._count.questions,
        attemptCount: finished.length,
        bestScore,
        lastAttemptId,
        attempts: finished.map((a) => ({
          id: a.id,
          score: a.score,
          startedAt: a.startedAt.toISOString(),
          finishedAt: a.finishedAt?.toISOString() ?? null,
        })),
        createdAt: s.createdAt.toISOString(),
      };
    });
  }

  async create(payload: CreateCertSimuladoPayload, userId: string) {
    const { certKey, name, topics } = payload;

    await this.validateTopicAvailability(certKey, topics, userId);

    const selectedQuestionIds = await this.drawQuestions(certKey, topics, userId);
    const autoName = name?.trim() || `${certKey} – ${selectedQuestionIds.length} questões`;

    const simulado = await prisma.certificationSimulado.create({
      data: {
        name: autoName,
        certKey,
        userId,
        topics: { create: topics.map((t) => ({ topicName: t.topicName, questionCount: t.questionCount })) },
        questions: {
          create: selectedQuestionIds.map((id, index) => ({ questionId: id, order: index })),
        },
      },
      include: { _count: { select: { questions: true } } },
    });

    return {
      id: simulado.id,
      name: simulado.name,
      certKey: simulado.certKey,
      certLabel: simulado.certKey,
      totalQuestions: simulado._count.questions,
      attemptCount: 0,
      bestScore: null,
      lastAttemptId: null,
      attempts: [],
      createdAt: simulado.createdAt.toISOString(),
    };
  }

  private async validateTopicAvailability(
    certKey: string,
    topics: CertSimuladoTopicConfig[],
    userId: string
  ) {
    for (const t of topics) {
      const count = await prisma.question.count({
        where: { userId, certificationTitle: certKey, topic: t.topicName },
      });

      if (count < t.questionCount) {
        throw Object.assign(
          new Error(
            `Questões insuficientes para o tópico "${t.topicName}": ${count} disponíveis, ${t.questionCount} necessárias`
          ),
          { status: 422 }
        );
      }
    }
  }

  private async drawQuestions(
    certKey: string,
    topics: CertSimuladoTopicConfig[],
    userId: string
  ): Promise<number[]> {
    const ids: number[] = [];

    for (const t of topics) {
      const questions = await prisma.question.findMany({
        where: { userId, certificationTitle: certKey, topic: t.topicName },
        select: { id: true },
      });
      const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, t.questionCount);

      ids.push(...shuffled.map((q) => q.id));
    }

    return ids;
  }

  async delete(id: number, userId: string) {
    const s = await prisma.certificationSimulado.findFirst({ where: { id, userId } });

    if (!s) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });
    await prisma.certificationSimulado.delete({ where: { id } });
  }

  async getById(id: number, userId: string) {
    const simulado = await prisma.certificationSimulado.findFirst({
      where: { id, userId },
      include: {
        topics: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            question: { include: { options: true, answer: { include: { explanations: true } } } },
          },
        },
        attempts: { orderBy: { startedAt: 'desc' } },
      },
    });

    if (!simulado) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });

    return simulado;
  }

  async startAttempt(simuladoId: number, userId: string) {
    const s = await prisma.certificationSimulado.findFirst({ where: { id: simuladoId, userId } });

    if (!s) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });

    return prisma.certificationSimuladoAttempt.create({ data: { simuladoId, userId } });
  }

  async finishAttempt(
    simuladoId: number,
    attemptId: number,
    userId: string,
    answers: { simuladoQuestionId: number; selectedOptions: string[] }[],
    score: number
  ) {
    const attempt = await prisma.certificationSimuladoAttempt.findFirst({
      where: { id: attemptId, simuladoId, userId },
    });

    if (!attempt) throw Object.assign(new Error('Tentativa não encontrada'), { status: 404 });

    await prisma.$transaction([
      prisma.certificationSimuladoAttemptAnswer.createMany({
        data: answers.map((a) => ({
          attemptId,
          simuladoQuestionId: a.simuladoQuestionId,
          selectedOptions: JSON.stringify(a.selectedOptions),
        })),
      }),
      prisma.certificationSimuladoAttempt.update({
        where: { id: attemptId },
        data: { finishedAt: new Date(), score },
      }),
    ]);
  }

  async getAttemptResult(simuladoId: number, attemptId: number, userId: string) {
    const attempt = await prisma.certificationSimuladoAttempt.findFirst({
      where: { id: attemptId, simuladoId, userId },
      include: {
        answers: true,
        simulado: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                question: { include: { options: true, answer: { include: { explanations: true } } } },
              },
            },
          },
        },
      },
    });

    if (!attempt) throw Object.assign(new Error('Tentativa não encontrada'), { status: 404 });

    const topicMap = new Map<string, { correct: number; total: number }>();
    const answersMap = new Map(
      attempt.answers.map((a) => [a.simuladoQuestionId, JSON.parse(a.selectedOptions) as string[]])
    );

    for (const sq of attempt.simulado.questions) {
      const topic = sq.question.topic;
      const correctOptions: string[] = sq.question.answer
        ? (sq.question.answer.correctOptions as unknown as string[])
        : [];
      const selected = answersMap.get(sq.id) ?? [];
      const isCorrect =
        correctOptions.length > 0 &&
        selected.length === correctOptions.length &&
        selected.every((s) => correctOptions.includes(s));

      if (!topicMap.has(topic)) topicMap.set(topic, { correct: 0, total: 0 });
      const entry = topicMap.get(topic)!;

      entry.total += 1;
      if (isCorrect) entry.correct += 1;
    }

    return {
      attempt: {
        id: attempt.id,
        simuladoId: attempt.simuladoId,
        startedAt: attempt.startedAt.toISOString(),
        finishedAt: attempt.finishedAt?.toISOString() ?? null,
        score: attempt.score,
        answers: attempt.answers.map((a) => ({
          simuladoQuestionId: a.simuladoQuestionId,
          selectedOptions: JSON.parse(a.selectedOptions) as string[],
        })),
      },
      simulado: {
        id: attempt.simulado.id,
        name: attempt.simulado.name,
        certKey: attempt.simulado.certKey,
        certLabel: attempt.simulado.certKey,
      },
      questions: attempt.simulado.questions.map((sq) => ({
        id: sq.id,
        order: sq.order,
        question: {
          id: sq.question.id,
          certificationTitle: sq.question.certificationTitle,
          text: sq.question.text,
          correctCount: sq.question.correctCount,
          topic: sq.question.topic,
          difficulty: sq.question.difficulty,
          options: Object.fromEntries(sq.question.options.map((o) => [o.label, o.text])),
          answer: sq.question.answer
            ? {
                questionId: sq.question.answer.questionId,
                correctOptions: sq.question.answer.correctOptions as unknown as string[],
                explanations: Object.fromEntries(sq.question.answer.explanations.map((e) => [e.label, e.text])),
              }
            : null,
          topicSubarea: sq.question.topicSubarea ?? undefined,
        },
      })),
      topicBreakdown: Array.from(topicMap.entries()).map(([topicName, v]) => ({
        topicName,
        correct: v.correct,
        total: v.total,
      })),
    };
  }
}
