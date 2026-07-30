import type { UserPlan, QuotaAction, UsageStats } from '@/shared/types';

import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/config/constants';

const PERIOD_DAYS = 30;

export class QuotaService {
  private async getUserWithPeriodReset(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const now = new Date();
    const periodStart = new Date(user.periodStartDate);
    const daysSince = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince >= PERIOD_DAYS) {
      return prisma.user.update({
        where: { id: userId },
        data: { questionsGeneratedThisPeriod: 0, periodStartDate: now },
      });
    }

    return user;
  }

  private resolvePlan(rawPlan: string): UserPlan {
    const valid: UserPlan[] = ['free', 'pro', 'pro_ai', 'tester', 'admin'];
    return valid.includes(rawPlan as UserPlan) ? (rawPlan as UserPlan) : 'free';
  }

  private resolveQuestionsLimit(user: { plan: string; customQuotaOverride: number | null }): number {
    const override = user.customQuotaOverride;
    if (override === -1) return Infinity;
    if (override != null) return override;
    return PLAN_LIMITS[this.resolvePlan(user.plan)].questionsPerPeriod;
  }

  async check(userId: string, action: QuotaAction, count: number): Promise<void> {
    const user = await this.getUserWithPeriodReset(userId);
    const plan = this.resolvePlan(user.plan);
    const limits = PLAN_LIMITS[plan];

    if (action === 'generate_questions') {
      const used = user.questionsGeneratedThisPeriod;
      const limit = this.resolveQuestionsLimit(user);

      if (used + count > limit) {
        const err = Object.assign(new Error(`Question generation limit reached (${limit}/period)`), {
          status: 403,
          body: {
            error: 'quota_exceeded',
            message: `Question generation limit reached (${limit}/period)`,
            limit,
            used,
            plan,
          },
        });
        throw err;
      }
    }

    if (action === 'create_exam') {
      const examCount = await prisma.exam.count({ where: { userId } });
      const limit = limits.maxExams;

      if (limit !== Infinity && examCount >= limit) {
        const err = Object.assign(new Error(`Exam limit reached (${limit})`), {
          status: 403,
          body: {
            error: 'quota_exceeded',
            message: `Exam limit reached (${limit})`,
            limit,
            used: examCount,
            plan,
          },
        });
        throw err;
      }
    }
  }

  // Atomically check and record question usage in a single DB write, preventing
  // TOCTOU race conditions where concurrent requests all pass the check before
  // any of them records usage. Returns the usageLog id so callers can update
  // token counts after the LLM call completes.
  async checkAndRecordQuestions(
    userId: string,
    count: number,
    context?: { refName?: string; refKey?: string; type?: string; topicName?: string },
  ): Promise<{ logId: string }> {
    const user = await this.getUserWithPeriodReset(userId);
    const plan = this.resolvePlan(user.plan);
    const limit = this.resolveQuestionsLimit(user);

    const contextData = {
      ...(context?.refName !== undefined && { refName: context.refName }),
      ...(context?.refKey !== undefined && { refKey: context.refKey }),
      ...(context?.type !== undefined && { type: context.type }),
      ...(context?.topicName !== undefined && { topicName: context.topicName }),
    };

    if (limit === Infinity) {
      const [, log] = await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: { questionsGeneratedThisPeriod: { increment: count } },
        }),
        prisma.usageLog.create({ data: { userId, action: 'generate_questions', count, ...contextData } }),
      ]);
      return { logId: log.id };
    }

    // Atomic conditional increment: only succeeds if used + count <= limit.
    const updated = await prisma.user.updateMany({
      where: {
        id: userId,
        questionsGeneratedThisPeriod: { lte: limit - count },
      },
      data: { questionsGeneratedThisPeriod: { increment: count } },
    });

    if (updated.count === 0) {
      const used = user.questionsGeneratedThisPeriod;
      const err = Object.assign(new Error(`Question generation limit reached (${limit}/period)`), {
        status: 403,
        body: {
          error: 'quota_exceeded',
          message: `Question generation limit reached (${limit}/period)`,
          limit,
          used,
          plan,
        },
      });
      throw err;
    }

    const log = await prisma.usageLog.create({ data: { userId, action: 'generate_questions', count, ...contextData } });
    return { logId: log.id };
  }

  // Undo a prior checkAndRecordQuestions when generation ultimately failed: give the
  // user their quota back and drop the usage log so it never counts toward cost analytics.
  async rollbackQuota(logId: string): Promise<void> {
    const log = await prisma.usageLog.findUnique({ where: { id: logId } });
    if (!log) return;

    await prisma.user.update({
      where: { id: log.userId },
      data: { questionsGeneratedThisPeriod: { decrement: log.count } },
    });
    await prisma.usageLog.delete({ where: { id: logId } });
  }

  async record(userId: string, action: QuotaAction, count: number): Promise<void> {
    await Promise.all([
      action === 'generate_questions'
        ? prisma.user.update({
            where: { id: userId },
            data: { questionsGeneratedThisPeriod: { increment: count } },
          })
        : Promise.resolve(),
      prisma.usageLog.create({ data: { userId, action, count } }),
    ]);
  }

  async getUsage(userId: string): Promise<UsageStats> {
    const user = await this.getUserWithPeriodReset(userId);
    const plan = this.resolvePlan(user.plan);
    const limits = PLAN_LIMITS[plan];
    const [certCount, examConcursoCount, savedQuestions] = await Promise.all([
      prisma.exam.count({ where: { userId, type: 'certification' } }),
      prisma.exam.count({ where: { userId, type: 'public_exam' } }),
      prisma.examQuestion.count({ where: { userId } }),
    ]);
    const examsUsed = certCount + examConcursoCount;
    const questionsLimit = this.resolveQuestionsLimit(user);

    return {
      plan,
      questionsUsed: user.questionsGeneratedThisPeriod,
      questionsLimit: questionsLimit === Infinity ? -1 : questionsLimit,
      questionsSavedInLibrary: savedQuestions,
      examsUsed,
      examsLimit: limits.maxExams === Infinity ? -1 : limits.maxExams,
      certificationsUsed: certCount,
      publicExamsUsed: examConcursoCount,
      periodStartDate: user.periodStartDate.toISOString(),
    };
  }
}
