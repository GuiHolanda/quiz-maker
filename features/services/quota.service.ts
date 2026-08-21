import type { UserPlan, QuotaAction, UsageStats, QuotaLimitCode } from '@/shared/types';

import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/config/constants';

const PERIOD_DAYS = 30;

// Every quota rejection carries the same shape: `error` stays 'quota_exceeded' for
// backward compatibility, `code` says *which* limit so the client can pick the right
// copy and upgrade CTA instead of falling back to a generic failure toast.
function quotaError(code: QuotaLimitCode, message: string, limit: number, used: number, plan: UserPlan) {
  return Object.assign(new Error(message), {
    status: 403,
    body: { error: 'quota_exceeded', code, message, limit, used, plan },
  });
}

export class QuotaService {
  private async getUserWithPeriodReset(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const now = new Date();
    const periodStart = new Date(user.periodStartDate);
    const daysSince = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince >= PERIOD_DAYS) {
      return prisma.user.update({
        where: { id: userId },
        data: { questionsGeneratedThisPeriod: 0, autoConfigThisPeriod: 0, periodStartDate: now },
      });
    }

    return user;
  }

  private resolvePlan(rawPlan: string): UserPlan {
    const valid: UserPlan[] = ['free', 'pro', 'pro_ai', 'sprint', 'tester', 'admin'];
    return valid.includes(rawPlan as UserPlan) ? (rawPlan as UserPlan) : 'free';
  }

  // Plan default or admin override, before any referral bonus — the ceiling that
  // `checkAndRecordQuestions` treats as "base" when deciding how much of a request
  // overflows into bonusQuestions.
  private resolveBaseQuestionsLimit(user: { plan: string; customQuotaOverride: number | null }): number {
    const override = user.customQuotaOverride;
    if (override === -1) return Infinity;
    if (override != null) return override;
    return PLAN_LIMITS[this.resolvePlan(user.plan)].questionsPerPeriod;
  }

  // Effective ceiling including bonusQuestions. Additive on top of resolveBaseQuestionsLimit
  // — a referral bonus survives an admin override or a plan upgrade instead of being
  // silently replaced by it (see achado 10 of the pricing tier audit).
  private resolveQuestionsLimit(user: {
    plan: string;
    customQuotaOverride: number | null;
    bonusQuestions: number;
  }): number {
    const base = this.resolveBaseQuestionsLimit(user);
    return base === Infinity ? Infinity : base + user.bonusQuestions;
  }

  async check(userId: string, action: QuotaAction, count: number): Promise<void> {
    const user = await this.getUserWithPeriodReset(userId);
    const plan = this.resolvePlan(user.plan);
    const limits = PLAN_LIMITS[plan];

    if (action === 'generate_questions') {
      const used = user.questionsGeneratedThisPeriod;
      const limit = this.resolveQuestionsLimit(user);

      if (used + count > limit) {
        throw quotaError('questions_limit', `Question generation limit reached (${limit}/period)`, limit, used, plan);
      }
    }

    if (action === 'create_exam') {
      const examCount = await prisma.exam.count({ where: { userId } });
      const limit = limits.maxExams;

      if (limit !== Infinity && examCount >= limit) {
        throw quotaError('exam_limit', `Exam limit reached (${limit})`, limit, examCount, plan);
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
    context?: { refName?: string; refKey?: string; type?: string; topicName?: string }
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
      throw quotaError(
        'questions_limit',
        `Question generation limit reached (${limit}/period)`,
        limit,
        user.questionsGeneratedThisPeriod,
        plan
      );
    }

    // The atomic gate above already guarantees priorUsed + count <= baseLimit + bonusQuestions,
    // so bonusQuestions only needs to cover whatever pushes this request past baseLimit alone.
    // Stored on the log (not just decremented here) so rollbackQuota can restore the exact
    // amount instead of re-deriving it against a balance that may have moved since.
    const baseLimit = this.resolveBaseQuestionsLimit(user);
    const overflow =
      baseLimit === Infinity
        ? 0
        : Math.min(Math.max(0, user.questionsGeneratedThisPeriod + count - baseLimit), user.bonusQuestions);

    if (overflow > 0) {
      await prisma.user.update({ where: { id: userId }, data: { bonusQuestions: { decrement: overflow } } });
    }

    const log = await prisma.usageLog.create({
      data: { userId, action: 'generate_questions', count, bonusQuestionsConsumed: overflow, ...contextData },
    });
    return { logId: log.id };
  }

  // Read-only peek at auto_config quota, used before the (cheap) identify call — a user
  // with no units left shouldn't burn tokens on identification when the job right after
  // it would just reject them. Does not record anything; checkAndRecordAutoConfig still
  // does the atomic check+increment when the job itself is created.
  async checkAutoConfigAvailable(userId: string): Promise<void> {
    const user = await this.getUserWithPeriodReset(userId);
    const plan = this.resolvePlan(user.plan);
    const limit = PLAN_LIMITS[plan].autoConfigPerPeriod;

    if (limit === Infinity) return;

    if (user.autoConfigThisPeriod >= limit) {
      throw quotaError(
        'auto_config_limit',
        `Auto-config limit reached (${limit}/period)`,
        limit,
        user.autoConfigThisPeriod,
        plan
      );
    }
  }

  // Atomic check+record for AI auto-config (certification search or edital extraction),
  // one unit per call — mirrors checkAndRecordQuestions but against autoConfigThisPeriod.
  // customQuotaOverride doesn't apply here (it's questions-only, see CLAUDE.md).
  async checkAndRecordAutoConfig(userId: string): Promise<{ logId: string }> {
    const user = await this.getUserWithPeriodReset(userId);
    const plan = this.resolvePlan(user.plan);
    const limit = PLAN_LIMITS[plan].autoConfigPerPeriod;

    if (limit === Infinity) {
      const [, log] = await Promise.all([
        prisma.user.update({ where: { id: userId }, data: { autoConfigThisPeriod: { increment: 1 } } }),
        prisma.usageLog.create({ data: { userId, action: 'auto_config', count: 1 } }),
      ]);
      return { logId: log.id };
    }

    const updated = await prisma.user.updateMany({
      where: { id: userId, autoConfigThisPeriod: { lte: limit - 1 } },
      data: { autoConfigThisPeriod: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw quotaError(
        'auto_config_limit',
        `Auto-config limit reached (${limit}/period)`,
        limit,
        user.autoConfigThisPeriod,
        plan
      );
    }

    const log = await prisma.usageLog.create({ data: { userId, action: 'auto_config', count: 1 } });
    return { logId: log.id };
  }

  // Undo a prior checkAndRecordQuestions/checkAndRecordAutoConfig when the pipeline
  // ultimately failed: give the user their quota back and drop the usage log so it
  // never counts toward cost analytics. Which period counter to refund follows the
  // log's own action, so one method serves both quota families.
  async rollbackQuota(logId: string): Promise<void> {
    const log = await prisma.usageLog.findUnique({ where: { id: logId } });
    if (!log) return;

    const field = log.action === 'auto_config' ? 'autoConfigThisPeriod' : 'questionsGeneratedThisPeriod';

    await prisma.user.update({
      where: { id: log.userId },
      data: {
        [field]: { decrement: log.count },
        ...(log.bonusQuestionsConsumed > 0 && { bonusQuestions: { increment: log.bonusQuestionsConsumed } }),
      },
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
      hasStripePortalAccess: !!user.stripeCustomerId,
      sprintExpiresAt: user.sprintExpiresAt ? user.sprintExpiresAt.toISOString() : null,
    };
  }
}
