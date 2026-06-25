import { prisma } from '@/lib/prisma';
import { CreateCertSimuladoPayload, CertSimuladoTopicConfig } from '@/shared/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { CertificationQuestionService } from '@/features/services/question.service';
import { certificationAnswersPrompt } from '@/config/prompts/certification-answers.prompt';

const ANSWERS_BATCH_SIZE = 10;

export class CertificationSimuladosService {
  private openAIServiceInstance: OpenAIService | null = null;
  private questionServiceInstance: CertificationQuestionService | null = null;

  private get openAIService(): OpenAIService {
    this.openAIServiceInstance ??= new OpenAIService();

    return this.openAIServiceInstance;
  }

  private get questionService(): CertificationQuestionService {
    this.questionServiceInstance ??= new CertificationQuestionService();

    return this.questionServiceInstance;
  }

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

    const certKeys = Array.from(new Set(simulados.map((s) => s.certKey)));
    const certs = await prisma.certification.findMany({
      where: { key: { in: certKeys }, OR: [{ userId }, { userId: null }] },
      select: { key: true, label: true },
    });
    const labelByKey = new Map(certs.map((c) => [c.key, c.label]));

    return simulados.map((s) => {
      const finished = s.attempts;
      const bestScore = finished.length > 0 ? Math.max(...finished.map((a) => a.score ?? 0)) : null;
      const lastAttemptId = finished.length > 0 ? finished[0].id : null;

      return {
        id: s.id,
        name: s.name,
        certKey: s.certKey,
        certLabel: labelByKey.get(s.certKey) ?? s.certKey,
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

    const certLabel = await this.resolveCertLabel(certKey, userId);

    await this.validateTopicAvailability(certLabel, topics, userId);

    const selectedQuestionIds = await this.drawQuestions(certLabel, topics, userId);
    const autoName = name?.trim() || `${certLabel} – ${selectedQuestionIds.length} questões`;

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
      certLabel,
      totalQuestions: simulado._count.questions,
      attemptCount: 0,
      bestScore: null,
      lastAttemptId: null,
      attempts: [],
      createdAt: simulado.createdAt.toISOString(),
    };
  }

  private async resolveCertLabel(certKey: string, userId: string): Promise<string> {
    const cert = await prisma.certification.findFirst({
      where: { key: certKey, OR: [{ userId }, { userId: null }] },
      select: { label: true },
    });

    if (!cert) {
      throw Object.assign(new Error(`Certificação "${certKey}" não encontrada`), { status: 404 });
    }

    return cert.label;
  }

  private async validateTopicAvailability(certLabel: string, topics: CertSimuladoTopicConfig[], userId: string) {
    for (const t of topics) {
      const count = await prisma.question.count({
        where: { userId, certificationTitle: certLabel, topic: t.topicName },
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

  private async drawQuestions(certLabel: string, topics: CertSimuladoTopicConfig[], userId: string): Promise<number[]> {
    const ids: number[] = [];

    for (const t of topics) {
      const questions = await prisma.question.findMany({
        where: { userId, certificationTitle: certLabel, topic: t.topicName },
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

  /**
   * Generates and persists Answer rows for any question in this simulado that
   * still lacks one. Idempotent — questions that already have an Answer are
   * skipped. Used by the frontend before starting an attempt so the result
   * page always has a gabarito to compare against.
   */
  async ensureAnswers(simuladoId: number, userId: string) {
    const simulado = await prisma.certificationSimulado.findFirst({
      where: { id: simuladoId, userId },
      include: {
        questions: {
          include: {
            question: { include: { options: true, answer: true } },
          },
        },
      },
    });

    if (!simulado) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });

    const certLabel = await this.resolveCertLabel(simulado.certKey, userId).catch(() => simulado.certKey);

    const missing = simulado.questions.map((sq) => sq.question).filter((q) => !q.answer);

    if (missing.length === 0) return { generated: 0 };

    type MissingQuestion = (typeof missing)[number];
    const byTopic = new Map<string, MissingQuestion[]>();

    for (const q of missing) {
      const list = byTopic.get(q.topic) ?? [];

      list.push(q);
      byTopic.set(q.topic, list);
    }

    let totalGenerated = 0;

    for (const [topic, topicQuestions] of Array.from(byTopic.entries())) {
      for (let i = 0; i < topicQuestions.length; i += ANSWERS_BATCH_SIZE) {
        const slice = topicQuestions.slice(i, i + ANSWERS_BATCH_SIZE).map((q: MissingQuestion) => ({
          id: q.id,
          text: q.text,
          correctCount: q.correctCount,
          options: Object.fromEntries(q.options.map((o: { label: string; text: string }) => [o.label, o.text])),
        }));

        const llmResponse = await this.openAIService.call(certificationAnswersPrompt, {
          certification_name: certLabel,
          topic,
          questions: JSON.stringify(slice),
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

    const certLabel = await this.resolveCertLabel(attempt.simulado.certKey, userId).catch(
      () => attempt.simulado.certKey
    );

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
        certLabel,
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
