import type { Feedback, PrismaClient } from '@prisma/client';

import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_LOCALES,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_ROUTE_MAX_LENGTH,
  FEEDBACK_USER_AGENT_MAX_LENGTH,
  type FeedbackCategory,
} from '@/config/constants';
import { prisma as defaultPrisma } from '@/lib/prisma';

interface FeedbackInput {
  readonly category: FeedbackCategory;
  readonly message: string;
  readonly route: string | null;
  readonly locale: string | null;
}

const CATEGORY_IDS: readonly string[] = FEEDBACK_CATEGORIES.map((category) => category.id);
const LOCALES: readonly string[] = FEEDBACK_LOCALES;

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function truncateText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function parseMessage(value: unknown): string {
  if (typeof value !== 'string') throw httpError(400, 'message must be a string');

  const trimmed = value.trim();

  if (!trimmed) throw httpError(400, 'message is required');

  if (trimmed.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    throw httpError(400, `message must have at most ${FEEDBACK_MESSAGE_MAX_LENGTH} characters`);
  }

  return trimmed;
}

function parseInput(input: unknown): FeedbackInput {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw httpError(400, 'Invalid payload');

  const { category, message, route, locale } = input as Record<string, unknown>;

  if (typeof category !== 'string' || !CATEGORY_IDS.includes(category)) throw httpError(400, 'Invalid category');

  const isKnownLocale = typeof locale === 'string' && LOCALES.includes(locale);

  return {
    category: category as FeedbackCategory,
    message: parseMessage(message),
    route: truncateText(route, FEEDBACK_ROUTE_MAX_LENGTH),
    locale: isKnownLocale ? locale : null,
  };
}

export class FeedbackService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma as unknown as PrismaClient) {
    this.prisma = prismaClient;
  }

  async create(userId: string | null, input: unknown, userAgent: string | null): Promise<Feedback> {
    const fields = parseInput(input);

    const author = userId
      ? await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, plan: true } })
      : null;

    return this.prisma.feedback.create({
      data: {
        userId,
        email: author?.email ?? null,
        plan: author?.plan ?? null,
        ...fields,
        userAgent: truncateText(userAgent, FEEDBACK_USER_AGENT_MAX_LENGTH),
      },
    });
  }

  async markNotified(feedbackId: string): Promise<void> {
    await this.prisma.feedback.update({ where: { id: feedbackId }, data: { notifiedAt: new Date() } });
  }
}
