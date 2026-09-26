import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { logger, serializeError, type LogFields } from '@/lib/logger';
import { looseKey, normalizeName, shuffleItems } from '@/lib/exam';
import { MOCK_EXAM_TIME_GRACE_MINUTES } from '@/config/constants';
import {
  CreateMockExamPayload,
  MockExamSectionConfig,
  MockExamQuestionSource,
  MockExamAvailability,
  ExamType,
} from '@/shared/types';
import { extractJson, OpenAIService } from '@/features/services/generation/openai.service';
import { ExamQuestionService } from '@/features/services/exam/exam-question.service';
import { MetricsService } from '@/features/services/billing/metrics.service';
import { ReferralService } from '@/features/services/billing/referral.service';
import { resolveQuestionFormat, type QuestionFormatKey } from '@/config/question-formats';
import { certificationAnswersPrompt } from '@/config/prompts/certification-questions/answers.prompt';
import { publicExamAnswersPrompt } from '@/config/prompts/public-exam-questions/answers.prompt';

const ANSWERS_BATCH_SIZE = 10;
const ANSWERS_CONCURRENCY = 4;
// Leaves headroom under the answers route's maxDuration (300s) for batches already in flight.
const ANSWERS_DEADLINE_MS = 200_000;

type QuestionWithOptions = Prisma.ExamQuestionGetPayload<{ include: { options: true } }>;

interface AnswerBatch {
  readonly sectionName: string;
  readonly format: QuestionFormatKey;
  readonly questions: QuestionWithOptions[];
}

interface AnswersExamRef {
  readonly name: string;
  readonly type: string;
  readonly role: string | null;
  readonly examBoardName: string;
}

class InvalidAnswersPayloadError extends Error {
  constructor(
    readonly responseLength: number,
    readonly responsePreview: string
  ) {
    super('LLM response is not a valid gabarito payload');
    this.name = 'InvalidAnswersPayloadError';
  }
}

function parseAnswersPayload(text: string): unknown[] {
  try {
    const parsed = JSON.parse(extractJson(text)) as { answers?: unknown } | null;

    if (Array.isArray(parsed?.answers)) return parsed.answers;
  } catch {
    // falls through to the typed error below, which carries a preview of the raw text
  }

  throw new InvalidAnswersPayloadError(text.length, text.slice(0, 300));
}

function normalizeOptionLabel(label: unknown): unknown {
  return typeof label === 'string' ? label.trim().toUpperCase() : label;
}

function parseSelectedOptions(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isAnswerCorrect(correctOptions: string[], selected: string[]): boolean {
  return (
    correctOptions.length > 0 &&
    selected.length === correctOptions.length &&
    selected.every((option) => correctOptions.includes(option))
  );
}

export class MockExamService {
  private openAIServiceInstance: OpenAIService | null = null;
  private questionServiceInstance: ExamQuestionService | null = null;
  private metricsServiceInstance: MetricsService | null = null;
  private referralServiceInstance: ReferralService | null = null;

  private get openAIService(): OpenAIService {
    this.openAIServiceInstance ??= new OpenAIService();

    return this.openAIServiceInstance;
  }

  private get questionService(): ExamQuestionService {
    this.questionServiceInstance ??= new ExamQuestionService();

    return this.questionServiceInstance;
  }

  private get metricsService(): MetricsService {
    this.metricsServiceInstance ??= new MetricsService();

    return this.metricsServiceInstance;
  }

  private get referralService(): ReferralService {
    this.referralServiceInstance ??= new ReferralService();

    return this.referralServiceInstance;
  }

  private examRef(exam: { id: string; name: string; type: string; provider?: any; examBoard?: any }) {
    return {
      id: exam.id,
      name: exam.name,
      type: exam.type as ExamType,
      provider: exam.provider ?? null,
      examBoard: exam.examBoard ?? null,
    };
  }

  async list(userId: string) {
    const mockExams = await prisma.mockExam.findMany({
      where: { userId },
      include: {
        exam: { include: { provider: true, examBoard: true } },
        sections: true,
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
      const comparableAttempts = finishedAttempts.filter((a) => !a.timedOut);
      const bestScore =
        comparableAttempts.length > 0 ? Math.max(...comparableAttempts.map((a) => a.score ?? 0)) : null;
      const lastAttemptId = finishedAttempts.length > 0 ? finishedAttempts[0].id : null;

      return {
        id: m.id,
        name: m.name,
        exam: this.examRef(m.exam),
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
          timedOut: a.timedOut,
        })),
        durationMinutes: m.durationMinutes,
        questionSource: m.questionSource as MockExamQuestionSource,
        passingScorePercent: m.exam.passingScore ?? null,
        createdAt: m.createdAt.toISOString(),
      };
    });
  }

  /**
   * Resolves each MockExamSectionConfig.sectionName to the configured
   * ExamSection row for this exam. Uses NFC + lowercase matching so minor
   * display drift (accents, whitespace, case) does not break the link.
   * Returns null sectionId when the name cannot be matched (caller should
   * treat as 0 questions available).
   */
  private async resolveSections(
    examId: string,
    sections: MockExamSectionConfig[]
  ): Promise<Array<MockExamSectionConfig & { sectionId: string | null }>> {
    const dbSections = await prisma.examSection.findMany({
      where: { examId },
      select: { id: true, name: true },
    });
    const byKey = new Map<string, string>();

    for (const s of dbSections) byKey.set(looseKey(s.name), s.id);

    return sections.map((s) => ({
      ...s,
      sectionId: byKey.get(looseKey(s.sectionName)) ?? null,
    }));
  }

  private ownedExamWhere(examId: string, userId: string) {
    return { id: examId, OR: [{ userId }, { isTemplate: true }] };
  }

  async create(payload: CreateMockExamPayload, userId: string) {
    const { examId, name, totalQuestions, sections } = payload;
    const questionSource: MockExamQuestionSource =
      payload.questionSource === 'unseen' || payload.questionSource === 'wrong' ? payload.questionSource : 'library';

    if (
      payload.durationMinutes != null &&
      (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 1)
    ) {
      throw Object.assign(new Error('Duração inválida'), { status: 400 });
    }

    const resolved = await this.resolveSections(examId, sections);

    await this.validateSectionAvailability(examId, resolved, userId, questionSource);

    const exam = await prisma.exam.findFirst({
      where: this.ownedExamWhere(examId, userId),
      include: { provider: true, examBoard: true },
    });

    if (!exam) throw Object.assign(new Error('Exame não encontrado'), { status: 404 });

    const autoName = name?.trim() || `${exam.name} – ${totalQuestions} questões`;

    const selectedQuestionIds = await this.drawQuestions(examId, resolved, userId, questionSource);

    const mockExam = await prisma.mockExam.create({
      data: {
        name: autoName,
        examId,
        userId,
        questionSource,
        durationMinutes: payload.durationMinutes ?? null,
        sections: { create: sections.map((s) => ({ sectionName: s.sectionName, questionCount: s.questionCount })) },
        questions: {
          create: selectedQuestionIds.map((id, index) => ({
            examQuestionId: id,
            order: index,
          })),
        },
      },
      include: {
        exam: { include: { provider: true, examBoard: true } },
        _count: { select: { questions: true } },
      },
    });

    return {
      id: mockExam.id,
      name: mockExam.name,
      exam: this.examRef(mockExam.exam),
      totalQuestions: mockExam._count.questions,
      attemptCount: 0,
      bestScore: null,
      lastAttemptId: null,
      openAttemptId: null,
      attempts: [],
      durationMinutes: mockExam.durationMinutes ?? null,
      questionSource,
      passingScorePercent: mockExam.exam.passingScore ?? null,
      createdAt: mockExam.createdAt.toISOString(),
    };
  }

  async availability(examId: string, userId: string): Promise<MockExamAvailability> {
    const exam = await prisma.exam.findFirst({ where: this.ownedExamWhere(examId, userId) });

    if (!exam) throw Object.assign(new Error('Exame não encontrado'), { status: 404 });

    const dbSections = await prisma.examSection.findMany({
      where: { examId },
      select: { id: true, name: true },
    });
    const history = await this.questionIdHistory(examId, userId);

    const sections: MockExamAvailability['sections'] = [];
    const totals = { library: 0, unseen: 0, wrong: 0 };

    for (const section of dbSections) {
      const rows = await prisma.examQuestion.findMany({
        where: {
          userId,
          OR: [
            { sectionId: section.id },
            { sectionId: null, examName: exam.name, sectionName: normalizeName(section.name) },
          ],
        },
        select: { id: true },
      });
      const library = rows.length;
      const unseen = rows.filter((row) => !history.seen.has(row.id)).length;
      const wrong = rows.filter((row) => history.wrong.has(row.id)).length;

      sections.push({ sectionName: section.name, library, unseen, wrong });
      totals.library += library;
      totals.unseen += unseen;
      totals.wrong += wrong;
    }

    return { sections, totals };
  }

  private async questionIdHistory(
    examId: string,
    userId: string
  ): Promise<{ seen: Set<number>; wrong: Set<number> }> {
    const answers = await prisma.mockExamAttemptAnswer.findMany({
      where: { attempt: { userId, finishedAt: { not: null }, mockExam: { examId } } },
      select: { isCorrect: true, mockExamQuestion: { select: { examQuestionId: true } } },
    });

    const seen = new Set<number>();
    const wrong = new Set<number>();

    for (const answer of answers) {
      const examQuestionId = answer.mockExamQuestion.examQuestionId;

      seen.add(examQuestionId);
      if (!answer.isCorrect) wrong.add(examQuestionId);
    }

    return { seen, wrong };
  }

  private buildSourceFilter(
    examId: string,
    userId: string,
    source: MockExamQuestionSource
  ): Prisma.ExamQuestionWhereInput {
    if (source !== 'unseen' && source !== 'wrong') return {};

    const answeredInFinishedAttempt: Prisma.MockExamAttemptAnswerWhereInput = {
      attempt: { userId, finishedAt: { not: null }, mockExam: { examId } },
    };

    if (source === 'unseen') {
      return { mockExamQuestions: { none: { attemptAnswers: { some: answeredInFinishedAttempt } } } };
    }

    return {
      mockExamQuestions: {
        some: { attemptAnswers: { some: { ...answeredInFinishedAttempt, isCorrect: false } } },
      },
    };
  }

  private async validateSectionAvailability(
    examId: string,
    sections: Array<MockExamSectionConfig & { sectionId: string | null }>,
    userId: string,
    source: MockExamQuestionSource
  ) {
    const exam = await prisma.exam.findFirst({ where: this.ownedExamWhere(examId, userId) });

    if (!exam) throw Object.assign(new Error('Exame não encontrado'), { status: 404 });

    const sourceFilter = this.buildSourceFilter(examId, userId, source);

    for (const s of sections) {
      // Prefer FK match when available. Fall back to the denormalized string
      // match for any rows still without sectionId.
      const count = s.sectionId
        ? await prisma.examQuestion.count({
            where: {
              ...sourceFilter,
              userId,
              OR: [
                { sectionId: s.sectionId },
                { sectionId: null, examName: exam.name, sectionName: normalizeName(s.sectionName) },
              ],
            },
          })
        : await prisma.examQuestion.count({
            where: { ...sourceFilter, examName: exam.name, sectionName: normalizeName(s.sectionName), userId },
          });

      if (count < s.questionCount) {
        throw Object.assign(
          new Error(
            `Questões insuficientes para "${s.sectionName}" (fonte: ${source}): ${count} disponíveis, ${s.questionCount} necessárias`
          ),
          { status: 422 }
        );
      }
    }
  }

  private async drawQuestions(
    examId: string,
    sections: Array<MockExamSectionConfig & { sectionId: string | null }>,
    userId: string,
    source: MockExamQuestionSource
  ): Promise<number[]> {
    const exam = await prisma.exam.findFirstOrThrow({ where: this.ownedExamWhere(examId, userId) });
    const sourceFilter = this.buildSourceFilter(examId, userId, source);
    const ids: number[] = [];

    for (const s of sections) {
      const questions = s.sectionId
        ? await prisma.examQuestion.findMany({
            where: {
              ...sourceFilter,
              userId,
              OR: [
                { sectionId: s.sectionId },
                { sectionId: null, examName: exam.name, sectionName: normalizeName(s.sectionName) },
              ],
            },
            select: { id: true },
          })
        : await prisma.examQuestion.findMany({
            where: { ...sourceFilter, examName: exam.name, sectionName: normalizeName(s.sectionName), userId },
            select: { id: true },
          });

      // Fisher-Yates, never sort() with a random comparator: an inconsistent comparator
      // leaves elements near their original index, and the slice right after would then
      // keep drawing the questions the query happened to return first — the same oldest
      // rows on every simulado.
      const drawn = shuffleItems(questions).slice(0, s.questionCount);

      ids.push(...drawn.map((q) => q.id));
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
        exam: { include: { provider: true, examBoard: true } },
        sections: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            examQuestion: {
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

    return {
      ...mockExam,
      passingScorePercent: mockExam.exam.passingScore ?? null,
      questionSource: mockExam.questionSource as MockExamQuestionSource,
    };
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
   * Generates and persists ExamAnswer rows for any question in this mock exam
   * that still lacks one. Idempotent — questions that already have an answer
   * are skipped. Batches run in parallel and stop at a time budget, so a big
   * mock exam ends before the route's maxDuration instead of being killed;
   * `remaining` tells the caller to ask again. Dispatches the answers prompt
   * by the exam type (certification vs public_exam).
   */
  async ensureAnswers(mockExamId: number, userId: string): Promise<{ generated: number; remaining: number }> {
    const startTime = Date.now();
    const mockExam = await prisma.mockExam.findFirst({
      where: { id: mockExamId, userId },
      include: {
        exam: { include: { provider: true, examBoard: true } },
        questions: {
          include: {
            examQuestion: { include: { options: true, answer: true } },
          },
        },
      },
    });

    if (!mockExam) throw Object.assign(new Error('Simulado não encontrado'), { status: 404 });

    const missing = mockExam.questions.map((mq) => mq.examQuestion).filter((q) => !q.answer);

    if (missing.length === 0) return { generated: 0, remaining: 0 };

    const batches = this.buildAnswerBatches(missing);
    const examRef: AnswersExamRef = {
      name: mockExam.exam.name,
      type: mockExam.exam.type,
      role: mockExam.exam.role,
      examBoardName: mockExam.exam.examBoard?.name ?? '',
    };
    const context = {
      mockExamId,
      userId,
      examType: examRef.type,
      missing: missing.length,
      batches: batches.length,
    };

    // count: 0 — backfilling a gabarito isn't a billable quota unit, but tokens still need
    // to land in UsageLogStep so plan margin in /admin/analytics reflects them (see achado 14).
    const logId = await this.metricsService.createLog(userId, 'generate_mock_answers', 0);
    const deadlineAt = startTime + ANSWERS_DEADLINE_MS;
    const queue = batches.map((batch, index) => ({ batch, index }));
    let generated = 0;
    let failedBatches = 0;

    logger.info('mock_exam.answers.started', context);

    const worker = async () => {
      while (queue.length > 0 && Date.now() < deadlineAt) {
        const { batch, index } = queue.shift()!;

        try {
          const saved = await this.generateAnswersBatch(examRef, batch, index, logId, context);

          generated += saved;
        } catch (err) {
          failedBatches += 1;
          logger.error('mock_exam.answers.batch_failed', {
            ...context,
            batchIndex: index,
            section: batch.sectionName,
            format: batch.format,
            size: batch.questions.length,
            ...(err instanceof InvalidAnswersPayloadError && {
              responseLength: err.responseLength,
              responsePreview: err.responsePreview,
            }),
            ...serializeError(err),
          });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(ANSWERS_CONCURRENCY, batches.length) }, worker));
    await this.bestEffortMetrics(logId, () => this.metricsService.finalize(logId, Date.now() - startTime));

    const remaining = missing.length - generated;
    const outcome = {
      ...context,
      generated,
      remaining,
      failedBatches,
      skippedBatches: queue.length,
      durationMs: Date.now() - startTime,
    };

    if (generated > 0) {
      try {
        await this.regradeFinishedAttempts(mockExamId, userId);
      } catch (err) {
        logger.error('mock_exam.answers.regrade_failed', { mockExamId, userId, ...serializeError(err) });
      }
    }

    if (generated === 0 && failedBatches > 0) {
      logger.error('mock_exam.answers.failed', outcome);

      throw Object.assign(new Error('Não foi possível gerar o gabarito agora. Tente novamente em instantes.'), {
        status: 502,
      });
    }

    logger[remaining > 0 ? 'warn' : 'info']('mock_exam.answers.completed', outcome);

    return { generated, remaining };
  }

  private buildAnswerBatches(questions: QuestionWithOptions[]): AnswerBatch[] {
    const groups = new Map<string, AnswerBatch>();

    for (const question of questions) {
      const format = resolveQuestionFormat(question.format).key;
      const key = `${question.sectionName}\u0000${format}`;
      const group = groups.get(key) ?? { sectionName: question.sectionName, format, questions: [] };

      group.questions.push(question);
      groups.set(key, group);
    }

    return Array.from(groups.values()).flatMap((group) => {
      const slices: AnswerBatch[] = [];

      for (let i = 0; i < group.questions.length; i += ANSWERS_BATCH_SIZE) {
        slices.push({ ...group, questions: group.questions.slice(i, i + ANSWERS_BATCH_SIZE) });
      }

      return slices;
    });
  }

  private callAnswersPrompt(exam: AnswersExamRef, batch: AnswerBatch) {
    const { sectionName, format, questions } = batch;

    if (exam.type === 'certification') {
      return this.openAIService.call(certificationAnswersPrompt, {
        certification_name: exam.name,
        topic: sectionName,
        format,
        questions: JSON.stringify(
          questions.map((q) => ({
            id: q.id,
            text: q.text,
            correctCount: q.correctCount,
            options: Object.fromEntries(q.options.map((o) => [o.label, o.text])),
          })),
          null,
          2
        ),
      });
    }

    return this.openAIService.call(publicExamAnswersPrompt, {
      public_exam_name: exam.name,
      exam_board_name: exam.examBoardName,
      role: exam.role ?? undefined,
      subject_name: sectionName,
      topic_name: questions[0]?.topicName ?? undefined,
      format,
      questions: questions.map((q) => ({
        id: q.id,
        examName: q.examName,
        sectionName: q.sectionName,
        topic: q.topicName ?? undefined,
        text: q.text,
        correctCount: q.correctCount,
        difficulty: q.difficulty,
        options: Object.fromEntries(q.options.map((o) => [o.label, o.text])),
      })),
    });
  }

  private async generateAnswersBatch(
    exam: AnswersExamRef,
    batch: AnswerBatch,
    batchIndex: number,
    logId: string,
    context: LogFields
  ): Promise<number> {
    const batchStart = Date.now();
    const llmResponse = await this.callAnswersPrompt(exam, batch);
    const llmDurationMs = Date.now() - batchStart;

    await this.bestEffortMetrics(logId, () =>
      this.metricsService.recordStep(
        logId,
        'answers',
        { inputTokens: llmResponse.inputTokens, outputTokens: llmResponse.outputTokens },
        llmDurationMs
      )
    );

    const { valid, invalid } = this.validateAnswers(parseAnswersPayload(llmResponse.text), batch.questions);
    const batchContext = {
      ...context,
      batchIndex,
      section: batch.sectionName,
      format: batch.format,
      size: batch.questions.length,
    };

    if (invalid.length > 0) {
      logger.warn('mock_exam.answers.batch_invalid_entries', {
        ...batchContext,
        invalid: invalid.length,
        samples: invalid.slice(0, 5),
      });
    }

    if (valid.length > 0) {
      await this.questionService.saveAnswers(valid.map((answer) => ({ ...answer, explanations: {} })));
    }

    logger.info('mock_exam.answers.batch_done', {
      ...batchContext,
      saved: valid.length,
      invalid: invalid.length,
      inputTokens: llmResponse.inputTokens,
      outputTokens: llmResponse.outputTokens,
      llmDurationMs,
      durationMs: Date.now() - batchStart,
    });

    return valid.length;
  }

  private validateAnswers(rawAnswers: unknown[], questions: QuestionWithOptions[]) {
    const questionsById = new Map(questions.map((question) => [question.id, question]));
    const seen = new Set<number>();
    const valid: { questionId: number; correctOptions: string[] }[] = [];
    const invalid: { questionId: unknown; correctOptions: unknown }[] = [];

    for (const raw of rawAnswers) {
      const entry = raw as { questionId?: unknown; correctOptions?: unknown } | null;
      const question = questionsById.get(Number(entry?.questionId));

      if (question && seen.has(question.id)) continue;

      const proposed = Array.isArray(entry?.correctOptions)
        ? Array.from(new Set(entry.correctOptions.map(normalizeOptionLabel)))
        : [];
      const optionLabels = new Set(question?.options.map((option) => option.label));
      const isValid =
        question !== undefined &&
        proposed.length === question.correctCount &&
        proposed.every((label) => typeof label === 'string' && optionLabels.has(label));

      if (isValid) {
        seen.add(question.id);
        valid.push({ questionId: question.id, correctOptions: proposed as string[] });
      } else {
        invalid.push({ questionId: entry?.questionId, correctOptions: entry?.correctOptions });
      }
    }

    return { valid, invalid };
  }

  private async bestEffortMetrics(logId: string, write: () => Promise<unknown>) {
    try {
      await write();
    } catch (err) {
      logger.warn('mock_exam.answers.metrics_failed', { logId, ...serializeError(err) });
    }
  }

  private async regradeFinishedAttempts(mockExamId: number, userId: string) {
    const [questions, attempts] = await Promise.all([
      prisma.mockExamQuestion.findMany({
        where: { mockExamId },
        include: { examQuestion: { include: { answer: true } } },
      }),
      prisma.mockExamAttempt.findMany({
        where: { mockExamId, userId, finishedAt: { not: null } },
        include: { answers: true },
      }),
    ]);
    const correctOptionsByQuestionId = new Map(
      questions.map((mq) => [mq.id, (mq.examQuestion.answer?.correctOptions ?? []) as unknown as string[]])
    );
    const writes: Prisma.PrismaPromise<unknown>[] = [];

    for (const attempt of attempts) {
      const nowCorrectIds: number[] = [];
      const nowIncorrectIds: number[] = [];
      let score = 0;

      for (const answer of attempt.answers) {
        const isCorrect = isAnswerCorrect(
          correctOptionsByQuestionId.get(answer.mockExamQuestionId) ?? [],
          parseSelectedOptions(answer.selectedOptions)
        );

        if (isCorrect) score += 1;
        if (isCorrect !== answer.isCorrect) (isCorrect ? nowCorrectIds : nowIncorrectIds).push(answer.id);
      }

      if (nowCorrectIds.length > 0) {
        writes.push(
          prisma.mockExamAttemptAnswer.updateMany({
            where: { id: { in: nowCorrectIds } },
            data: { isCorrect: true },
          })
        );
      }
      if (nowIncorrectIds.length > 0) {
        writes.push(
          prisma.mockExamAttemptAnswer.updateMany({
            where: { id: { in: nowIncorrectIds } },
            data: { isCorrect: false },
          })
        );
      }
      if (score !== attempt.score) {
        writes.push(prisma.mockExamAttempt.update({ where: { id: attempt.id }, data: { score } }));
      }
    }

    if (writes.length === 0) return;

    await prisma.$transaction(writes);
    logger.info('mock_exam.answers.regraded', { mockExamId, userId, attempts: attempts.length, writes: writes.length });
  }

  async finishAttempt(
    mockExamId: number,
    attemptId: number,
    userId: string,
    answers: { mockExamQuestionId: number; selectedOptions: string[] }[]
  ) {
    const startTime = Date.now();
    const context = { mockExamId, attemptId, userId };
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id: attemptId, mockExamId, userId },
    });

    if (!attempt) throw Object.assign(new Error('Tentativa não encontrada'), { status: 404 });
    if (attempt.finishedAt != null) {
      logger.info('mock_exam.finish.already_finished', context);

      return;
    }

    const mockExam = await prisma.mockExam.findFirst({
      where: { id: mockExamId },
      select: { durationMinutes: true },
    });

    const mockExamQuestions = await prisma.mockExamQuestion.findMany({
      where: { mockExamId },
      include: { examQuestion: { include: { answer: true } } },
    });

    const missingAnswers = mockExamQuestions.filter((mq) => !mq.examQuestion.answer).length;
    const mockExamQuestionIds = new Set(mockExamQuestions.map((mq) => mq.id));
    const submittedAnswers = answers
      .filter((a) => mockExamQuestionIds.has(a.mockExamQuestionId))
      .map((a) => ({
        mockExamQuestionId: a.mockExamQuestionId,
        selectedOptions: Array.isArray(a.selectedOptions)
          ? a.selectedOptions.filter((option): option is string => typeof option === 'string')
          : [],
      }));

    const answersMap = new Map(submittedAnswers.map((a) => [a.mockExamQuestionId, a.selectedOptions]));
    const correctByMockExamQuestionId = new Map<number, boolean>();
    let score = 0;

    for (const mq of mockExamQuestions) {
      const correctOptions: string[] = mq.examQuestion.answer
        ? (mq.examQuestion.answer.correctOptions as unknown as string[])
        : [];
      const isCorrect = isAnswerCorrect(correctOptions, answersMap.get(mq.id) ?? []);

      correctByMockExamQuestionId.set(mq.id, isCorrect);
      if (isCorrect) score += 1;
    }

    const timedOut =
      mockExam?.durationMinutes != null &&
      Date.now() > attempt.startedAt.getTime() + (mockExam.durationMinutes + MOCK_EXAM_TIME_GRACE_MINUTES) * 60_000;

    await prisma.$transaction([
      prisma.mockExamAttemptAnswer.createMany({
        data: submittedAnswers.map((a) => ({
          attemptId,
          mockExamQuestionId: a.mockExamQuestionId,
          selectedOptions: JSON.stringify(a.selectedOptions),
          isCorrect: correctByMockExamQuestionId.get(a.mockExamQuestionId) ?? false,
        })),
      }),
      prisma.mockExamAttempt.update({
        where: { id: attemptId },
        data: { finishedAt: new Date(), score, timedOut },
      }),
    ]);

    logger[missingAnswers > 0 ? 'warn' : 'info']('mock_exam.finish.completed', {
      ...context,
      questions: mockExamQuestions.length,
      answered: submittedAnswers.filter((a) => a.selectedOptions.length > 0).length,
      missingAnswers,
      score,
      timedOut,
      durationMs: Date.now() - startTime,
    });

    // Finishing a mock exam is one of the two referral activation triggers (the other is
    // generating a first question batch) — never let this side effect fail the attempt.
    try {
      await this.referralService.activateIfEligible(userId);
    } catch (err) {
      logger.error('mock_exam.finish.referral_failed', { ...context, ...serializeError(err) });
    }
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
            exam: { include: { provider: true, examBoard: true } },
            questions: {
              orderBy: { order: 'asc' },
              include: {
                examQuestion: {
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

    const questions = attempt.mockExam.questions;
    const totalQuestions = questions.length;

    const correctOptionsByMqId = new Map<number, string[]>(
      questions.map((mq) => [
        mq.id,
        mq.examQuestion.answer ? (mq.examQuestion.answer.correctOptions as unknown as string[]) : [],
      ])
    );

    const sectionStatsFor = (selectedByMqId: Map<number, string[]>) => {
      const map = new Map<string, { correct: number; total: number }>();

      for (const mq of questions) {
        const sectionName = mq.examQuestion.sectionName;
        const correctOptions = correctOptionsByMqId.get(mq.id) ?? [];
        const selected = selectedByMqId.get(mq.id) ?? [];
        const isCorrect =
          correctOptions.length > 0 &&
          selected.length === correctOptions.length &&
          selected.every((s) => correctOptions.includes(s));

        if (!map.has(sectionName)) map.set(sectionName, { correct: 0, total: 0 });
        const entry = map.get(sectionName)!;

        entry.total += 1;
        if (isCorrect) entry.correct += 1;
      }

      return map;
    };

    const sectionMap = sectionStatsFor(
      new Map(attempt.answers.map((a) => [a.mockExamQuestionId, JSON.parse(a.selectedOptions) as string[]]))
    );

    const finishedSiblings = await prisma.mockExamAttempt.findMany({
      where: { mockExamId, userId, finishedAt: { not: null } },
      include: { answers: true },
      orderBy: { finishedAt: 'asc' },
    });

    const thisIndex = finishedSiblings.findIndex((a) => a.id === attemptId);
    const earlierAttempts = thisIndex >= 0 ? finishedSiblings.slice(0, thisIndex) : finishedSiblings;
    const comparableEarlierAttempts = earlierAttempts.filter((a) => !a.timedOut);
    const earlierSectionMaps = comparableEarlierAttempts.map((a) =>
      sectionStatsFor(
        new Map(a.answers.map((ans) => [ans.mockExamQuestionId, JSON.parse(ans.selectedOptions) as string[]]))
      )
    );

    const previousAvgPercentFor = (sectionName: string): number | null => {
      const percents = earlierSectionMaps
        .map((m) => m.get(sectionName))
        .filter((e): e is { correct: number; total: number } => !!e && e.total > 0)
        .map((e) => (e.correct / e.total) * 100);

      if (percents.length === 0) return null;

      return Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length);
    };

    const overallPreviousAvgPercent =
      comparableEarlierAttempts.length > 0 && totalQuestions > 0
        ? Math.round(
            comparableEarlierAttempts.reduce((sum, a) => sum + ((a.score ?? 0) / totalQuestions) * 100, 0) /
              comparableEarlierAttempts.length
          )
        : null;

    return {
      attempt: {
        id: attempt.id,
        mockExamId: attempt.mockExamId,
        startedAt: attempt.startedAt.toISOString(),
        finishedAt: attempt.finishedAt?.toISOString() ?? null,
        score: attempt.score,
        timedOut: attempt.timedOut,
        answers: attempt.answers.map((a) => ({
          mockExamQuestionId: a.mockExamQuestionId,
          selectedOptions: JSON.parse(a.selectedOptions) as string[],
        })),
      },
      mockExam: {
        id: attempt.mockExam.id,
        name: attempt.mockExam.name,
        exam: this.examRef(attempt.mockExam.exam),
      },
      questions: attempt.mockExam.questions.map((mq) => ({
        id: mq.id,
        order: mq.order,
        examQuestion: {
          id: mq.examQuestion.id,
          text: mq.examQuestion.text,
          correctCount: mq.examQuestion.correctCount,
          sectionName: mq.examQuestion.sectionName,
          topic: mq.examQuestion.topicName,
          difficulty: mq.examQuestion.difficulty,
          options: Object.fromEntries(mq.examQuestion.options.map((o) => [o.label, o.text])),
          answer: mq.examQuestion.answer
            ? {
                questionId: mq.examQuestion.answer.questionId,
                correctOptions: mq.examQuestion.answer.correctOptions as unknown as string[],
                explanations: Object.fromEntries(mq.examQuestion.answer.explanations.map((e) => [e.label, e.text])),
              }
            : null,
          examName: mq.examQuestion.examName,
        },
      })),
      sectionBreakdown: Array.from(sectionMap.entries()).map(([sectionName, v]) => ({
        sectionName,
        correct: v.correct,
        total: v.total,
        weightPercent: totalQuestions > 0 ? Math.round((v.total / totalQuestions) * 100) : 0,
        previousAvgPercent: previousAvgPercentFor(sectionName),
      })),
      examMeta: {
        passingScorePercent: attempt.mockExam.exam.passingScore ?? null,
        durationMinutes: attempt.mockExam.durationMinutes ?? attempt.mockExam.exam.examDurationMinutes ?? null,
        attemptDurationMinutes: attempt.mockExam.durationMinutes ?? null,
      },
      attemptNumber: thisIndex >= 0 ? thisIndex + 1 : finishedSiblings.length + 1,
      totalAttempts: thisIndex >= 0 ? finishedSiblings.length : finishedSiblings.length + 1,
      overallPreviousAvgPercent,
    };
  }
}
