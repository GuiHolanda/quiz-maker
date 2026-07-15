import type { UserPlan, UserAdminRow, AdminOverviewStats, AdminAuditEntry } from '@/shared/types';

import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/config/constants';

export class AdminService {
  async getOverview(): Promise<AdminOverviewStats> {
    const [allUsers, usageLogs, tokenAgg, allTokensByUser] = await Promise.all([
      prisma.user.findMany({ select: { plan: true, questionsGeneratedThisPeriod: true, subscriptionStatus: true } }),
      prisma.usageLog.aggregate({ _sum: { count: true }, where: { action: 'generate_questions' } }),
      prisma.usageLog.aggregate({
        _sum: { inputTokens: true, outputTokens: true },
        where: { action: 'generate_questions' },
      }),
      prisma.usageLog.groupBy({
        by: ['userId'],
        _sum: { inputTokens: true, outputTokens: true, count: true },
        where: { action: 'generate_questions' },
      }),
    ]);

    const byPlan: Record<UserPlan, number> = { free: 0, pro: 0, pro_ai: 0, tester: 0, admin: 0 };

    for (const u of allUsers) {
      const p = u.plan as UserPlan;
      if (p in byPlan) byPlan[p]++;
    }

    const activeSubscriptions = allUsers.filter((u) => u.subscriptionStatus === 'active').length;
    const planLimits = Object.fromEntries(
      Object.entries(PLAN_LIMITS).map(([k, v]) => [k, v.questionsPerPeriod])
    ) as Record<UserPlan, number>;

    const usersWithFiniteLimit = allUsers.filter((u) => {
      const limit = planLimits[u.plan as UserPlan];
      return limit !== Infinity && limit > 0;
    });

    const avgUsagePercent =
      usersWithFiniteLimit.length > 0
        ? usersWithFiniteLimit.reduce((sum, u) => {
            const limit = planLimits[u.plan as UserPlan];
            return sum + (u.questionsGeneratedThisPeriod / limit) * 100;
          }, 0) / usersWithFiniteLimit.length
        : 0;

    const totalQuestionsGenerated = usageLogs._sum.count ?? 0;
    const totalInputTokens = tokenAgg._sum.inputTokens ?? 0;
    const totalOutputTokens = tokenAgg._sum.outputTokens ?? 0;
    const avgTokensPerQuestion =
      totalQuestionsGenerated > 0
        ? Math.round((totalInputTokens + totalOutputTokens) / totalQuestionsGenerated)
        : 0;

    const allUserPlans = await prisma.user.findMany({
      where: { id: { in: allTokensByUser.map((t) => t.userId) } },
      select: { id: true, plan: true },
    });
    const planById = new Map(allUserPlans.map((u) => [u.id, u.plan as UserPlan]));

    const emptyPlanStats = () => ({ inputTokens: 0, outputTokens: 0, questionsGenerated: 0 });
    const tokensByPlan: Record<UserPlan, { inputTokens: number; outputTokens: number; questionsGenerated: number }> = {
      free: emptyPlanStats(),
      pro: emptyPlanStats(),
      pro_ai: emptyPlanStats(),
      tester: emptyPlanStats(),
      admin: emptyPlanStats(),
    };
    for (const row of allTokensByUser) {
      const plan = planById.get(row.userId);
      if (plan && plan in tokensByPlan) {
        tokensByPlan[plan].inputTokens += row._sum.inputTokens ?? 0;
        tokensByPlan[plan].outputTokens += row._sum.outputTokens ?? 0;
        tokensByPlan[plan].questionsGenerated += row._sum.count ?? 0;
      }
    }

    return {
      totalUsers: allUsers.length,
      byPlan,
      activeSubscriptions,
      totalQuestionsGenerated,
      avgUsagePercent: Math.round(avgUsagePercent),
      totalInputTokens,
      totalOutputTokens,
      avgTokensPerQuestion,
      tokensByPlan,
    };
  }

  async listUsers(params: {
    page: number;
    limit: number;
    search?: string;
    plan?: string;
    subscriptionStatus?: string;
  }): Promise<{ users: UserAdminRow[]; total: number; page: number; totalPages: number }> {
    const { page, limit, search, plan, subscriptionStatus } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
      ...(plan ? { plan } : {}),
      ...(subscriptionStatus ? { subscriptionStatus } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          customQuotaOverride: true,
          questionsGeneratedThisPeriod: true,
          periodStartDate: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);
    const tokensByUser = await prisma.usageLog.groupBy({
      by: ['userId'],
      _sum: { inputTokens: true, outputTokens: true, count: true },
      where: { userId: { in: userIds }, action: 'generate_questions' },
    });
    const tokenMap = new Map(tokensByUser.map((t) => [t.userId, t._sum]));

    return {
      users: users.map((u) => ({
        ...u,
        plan: u.plan as UserPlan,
        periodStartDate: u.periodStartDate.toISOString(),
        createdAt: u.createdAt.toISOString(),
        totalInputTokens: tokenMap.get(u.id)?.inputTokens ?? 0,
        totalOutputTokens: tokenMap.get(u.id)?.outputTokens ?? 0,
        totalQuestionsGeneratedAllTime: tokenMap.get(u.id)?.count ?? 0,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(
    adminId: string,
    targetId: string,
    data: { plan?: UserPlan; customQuotaOverride?: number | null }
  ): Promise<UserAdminRow> {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: targetId },
      select: { plan: true, customQuotaOverride: true },
    });

    const updated = await prisma.user.update({
      where: { id: targetId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        customQuotaOverride: true,
        questionsGeneratedThisPeriod: true,
        periodStartDate: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });

    const [, tokenTotals] = await Promise.all([
      prisma.adminAuditLog.create({
        data: {
          adminId,
          targetId,
          action: data.plan && data.plan !== before.plan ? 'change_plan' : 'set_quota_override',
          before: JSON.stringify({ plan: before.plan, customQuotaOverride: before.customQuotaOverride }),
          after: JSON.stringify({ plan: updated.plan, customQuotaOverride: updated.customQuotaOverride }),
        },
      }),
      prisma.usageLog.aggregate({
        where: { userId: targetId },
        _sum: { inputTokens: true, outputTokens: true, count: true },
      }),
    ]);

    return {
      ...updated,
      plan: updated.plan as UserPlan,
      periodStartDate: updated.periodStartDate.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      totalInputTokens: tokenTotals._sum.inputTokens ?? 0,
      totalOutputTokens: tokenTotals._sum.outputTokens ?? 0,
      totalQuestionsGeneratedAllTime: tokenTotals._sum.count ?? 0,
    };
  }

  async getAuditLog(params: {
    page: number;
    limit: number;
    adminId?: string;
    targetId?: string;
  }): Promise<{ entries: AdminAuditEntry[]; total: number; page: number; totalPages: number }> {
    const { page, limit, adminId, targetId } = params;
    const skip = (page - 1) * limit;
    const where = {
      ...(adminId ? { adminId } : {}),
      ...(targetId ? { targetId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    const allIds = logs.map((l) => l.adminId).concat(logs.map((l) => l.targetId));
    const userIds = Array.from(new Set(allIds));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    return {
      entries: logs.map((l) => ({
        id: l.id,
        adminId: l.adminId,
        adminName: userMap[l.adminId]?.name ?? null,
        adminEmail: userMap[l.adminId]?.email ?? '',
        targetId: l.targetId,
        targetName: userMap[l.targetId]?.name ?? null,
        targetEmail: userMap[l.targetId]?.email ?? '',
        action: l.action,
        before: l.before,
        after: l.after,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
