import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/config/constants';
import type { UserPlan, QuotaAction, UsageStats } from '@/types';

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

  async check(userId: string, action: QuotaAction, count: number): Promise<void> {
    const user = await this.getUserWithPeriodReset(userId);
    const plan = (user.plan === 'pro' ? 'pro' : 'free') as UserPlan;
    const limits = PLAN_LIMITS[plan];

    if (action === 'generate_questions') {
      const used = user.questionsGeneratedThisPeriod;
      const limit = limits.questionsPerPeriod;
      if (used + count > limit) {
        const err = Object.assign(new Error(`Question generation limit reached (${limit}/period)`), {
          status: 403,
          body: { error: 'quota_exceeded', message: `Question generation limit reached (${limit}/period)`, limit, used, plan },
        });
        throw err;
      }
    }

    if (action === 'create_certification') {
      const certCount = await prisma.certification.count({ where: { userId } });
      const limit = limits.maxCertifications;
      if (limit !== Infinity && certCount >= limit) {
        const err = Object.assign(new Error(`Certification limit reached (${limit})`), {
          status: 403,
          body: { error: 'quota_exceeded', message: `Certification limit reached (${limit})`, limit, used: certCount, plan },
        });
        throw err;
      }
    }
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
    const plan = (user.plan === 'pro' ? 'pro' : 'free') as UserPlan;
    const limits = PLAN_LIMITS[plan];
    const certCount = await prisma.certification.count({ where: { userId } });

    return {
      plan,
      questionsUsed: user.questionsGeneratedThisPeriod,
      questionsLimit: limits.questionsPerPeriod,
      certificationsUsed: certCount,
      certificationsLimit: limits.maxCertifications === Infinity ? -1 : limits.maxCertifications,
      periodStartDate: user.periodStartDate.toISOString(),
    };
  }
}
