import { Prisma, type PrismaClient, type QuestionReport } from '@prisma/client';

import {
  QUESTION_REPORT_COMMENT_MAX_LENGTH,
  QUESTION_REPORT_REASONS,
  QUESTION_REPORT_SURFACES,
  QUESTION_REPORT_TERMINAL_STATUSES,
  type QuestionReportReason,
  type QuestionReportSurface,
} from '@/config/constants';
import { prisma as defaultPrisma } from '@/lib/prisma';

interface QuestionReportInput {
  readonly examQuestionId: number;
  readonly reason: QuestionReportReason;
  readonly surface: QuestionReportSurface;
  readonly comment: string | null;
  readonly mockExamAttemptId: number | null;
}

interface ReportFields {
  readonly reason: QuestionReportReason;
  readonly comment: string | null;
  readonly surface: QuestionReportSurface;
  readonly mockExamAttemptId: number | null;
  readonly questionText: string;
  readonly examName: string;
  readonly sectionName: string;
  readonly topicName: string | null;
}

export interface CreateQuestionReportResult {
  readonly report: QuestionReport;
  readonly reopened: boolean;
  readonly reporter: { readonly email: string; readonly plan: string } | null;
}

const REASON_IDS: readonly string[] = QUESTION_REPORT_REASONS.map((reason) => reason.id);
const SURFACES: readonly string[] = QUESTION_REPORT_SURFACES;
const TERMINAL_STATUSES: readonly string[] = QUESTION_REPORT_TERMINAL_STATUSES;

function httpError(status: number, message: string, code?: string) {
  return Object.assign(new Error(message), { status, ...(code && { body: { code } }) });
}

function alreadyReportedError() {
  return httpError(409, 'Question already reported', 'already_reported');
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function parseComment(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value !== 'string') throw httpError(400, 'comment must be a string');

  const trimmed = value.trim();

  if (trimmed.length > QUESTION_REPORT_COMMENT_MAX_LENGTH) {
    throw httpError(400, `comment must have at most ${QUESTION_REPORT_COMMENT_MAX_LENGTH} characters`);
  }

  return trimmed || null;
}

function parseAttemptId(value: unknown, surface: QuestionReportSurface): number | null {
  if (value === undefined || value === null) return null;

  if (surface === 'question_bank' || !isPositiveInteger(value)) throw httpError(400, 'Invalid mockExamAttemptId');

  return value;
}

function parseInput(input: unknown): QuestionReportInput {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw httpError(400, 'Invalid payload');

  const { examQuestionId, reason, surface, comment, mockExamAttemptId } = input as Record<string, unknown>;

  if (!isPositiveInteger(examQuestionId)) throw httpError(400, 'examQuestionId must be a positive integer');

  if (typeof reason !== 'string' || !REASON_IDS.includes(reason)) throw httpError(400, 'Invalid reason');

  if (typeof surface !== 'string' || !SURFACES.includes(surface)) throw httpError(400, 'Invalid surface');

  const validSurface = surface as QuestionReportSurface;

  return {
    examQuestionId,
    reason: reason as QuestionReportReason,
    surface: validSurface,
    comment: parseComment(comment),
    mockExamAttemptId: parseAttemptId(mockExamAttemptId, validSurface),
  };
}

export class QuestionReportService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma as unknown as PrismaClient) {
    this.prisma = prismaClient;
  }

  async create(userId: string, input: unknown): Promise<CreateQuestionReportResult> {
    const { examQuestionId, reason, surface, comment, mockExamAttemptId } = parseInput(input);

    const question = await this.findVisibleQuestion(userId, examQuestionId);

    await this.assertOwnsAttempt(userId, mockExamAttemptId);

    const fields: ReportFields = {
      reason,
      comment,
      surface,
      mockExamAttemptId,
      questionText: question.text,
      examName: question.examName,
      sectionName: question.sectionName,
      topicName: question.topicName,
    };

    const existing = await this.prisma.questionReport.findUnique({
      where: { userId_examQuestionId: { userId, examQuestionId } },
    });

    const { report, reopened } = existing
      ? await this.reopen(existing, fields)
      : await this.insert(userId, examQuestionId, fields);

    const reporter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, plan: true },
    });

    return { report, reopened, reporter };
  }

  async markNotified(reportId: string): Promise<void> {
    await this.prisma.questionReport.update({ where: { id: reportId }, data: { notifiedAt: new Date() } });
  }

  private async findVisibleQuestion(userId: string, examQuestionId: number) {
    const question = await this.prisma.examQuestion.findUnique({
      where: { id: examQuestionId },
      select: { id: true, text: true, examName: true, sectionName: true, topicName: true, userId: true },
    });

    if (!question || (question.userId !== null && question.userId !== userId)) {
      throw httpError(404, 'Question not found');
    }

    return question;
  }

  private async assertOwnsAttempt(userId: string, mockExamAttemptId: number | null) {
    if (mockExamAttemptId === null) return;

    const attempt = await this.prisma.mockExamAttempt.findFirst({
      where: { id: mockExamAttemptId, userId },
      select: { id: true },
    });

    if (!attempt) throw httpError(404, 'Attempt not found');
  }

  private async reopen(existing: QuestionReport, fields: ReportFields) {
    if (!TERMINAL_STATUSES.includes(existing.status)) throw alreadyReportedError();

    const report = await this.prisma.questionReport.update({
      where: { id: existing.id },
      data: { ...fields, status: 'open', resolvedAt: null, resolutionNote: null, notifiedAt: null },
    });

    return { report, reopened: true };
  }

  private async insert(userId: string, examQuestionId: number, fields: ReportFields) {
    try {
      const report = await this.prisma.questionReport.create({ data: { userId, examQuestionId, ...fields } });

      return { report, reopened: false };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw alreadyReportedError();

      throw err;
    }
  }
}
