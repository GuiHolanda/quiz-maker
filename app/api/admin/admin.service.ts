import type { UserPlan, UserAdminRow, AdminOverviewStats, AdminAuditEntry, AdminActionStats } from '@/shared/types';

import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/config/constants';

// Nearest-rank percentile over an ascending-sorted array — simple and deterministic,
// no interpolation between ranks. Empty input returns 0 rather than NaN.
export function percentile(sortedAscending: number[], p: number): number {
  if (sortedAscending.length === 0) return 0;

  const index = Math.min(Math.ceil((p / 100) * sortedAscending.length) - 1, sortedAscending.length - 1);

  return sortedAscending[Math.max(index, 0)];
}

export class AdminService {
  async getOverview(): Promise<AdminOverviewStats> {
    const [allUsers, usageLogs, tokenAgg, allStepsByLog, allCountsByUser, actionGroups, stepGroups] = await Promise.all(
      [
        prisma.user.findMany({ select: { plan: true, questionsGeneratedThisPeriod: true, subscriptionStatus: true } }),
        prisma.usageLog.aggregate({ _sum: { count: true }, where: { action: 'generate_questions' } }),
        prisma.usageLogStep.aggregate({ _sum: { inputTokens: true, outputTokens: true } }),
        prisma.usageLogStep.groupBy({
          by: ['usageLogId'],
          _sum: { inputTokens: true, outputTokens: true },
        }),
        prisma.usageLog.groupBy({
          by: ['userId'],
          _sum: { count: true },
          where: { action: 'generate_questions' },
        }),
        // per-action aggregation
        prisma.usageLog.groupBy({
          by: ['action'],
          _sum: { count: true },
          _avg: { totalDurationMs: true },
          _count: { id: true },
        }),
        // per-action per-step aggregation
        prisma.usageLogStep.groupBy({
          by: ['step', 'usageLogId'],
          _sum: { inputTokens: true, outputTokens: true },
          _avg: { durationMs: true },
        }),
      ]
    );

    const byPlan: Record<UserPlan, number> = { free: 0, pro: 0, pro_ai: 0, sprint: 0, tester: 0, admin: 0 };

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
      totalQuestionsGenerated > 0 ? Math.round((totalInputTokens + totalOutputTokens) / totalQuestionsGenerated) : 0;

    // Resolve usageLogId → userId for steps, then join with user plans
    const logIds = allStepsByLog.map((s) => s.usageLogId);
    const logUserRows = await prisma.usageLog.findMany({
      where: { id: { in: logIds } },
      select: { id: true, userId: true },
    });
    const userIdByLogId = new Map(logUserRows.map((l) => [l.id, l.userId]));

    const userIdsForTokens = logUserRows.map((l) => l.userId);
    const userIdsForCounts = allCountsByUser.map((r) => r.userId);
    const allUserIds = Array.from(new Set([...userIdsForTokens, ...userIdsForCounts]));

    const allUserPlans = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true, plan: true },
    });
    const planById = new Map(allUserPlans.map((u) => [u.id, u.plan as UserPlan]));

    const emptyPlanStats = () => ({ inputTokens: 0, outputTokens: 0, questionsGenerated: 0 });
    const tokensByPlan: Record<UserPlan, { inputTokens: number; outputTokens: number; questionsGenerated: number }> = {
      free: emptyPlanStats(),
      pro: emptyPlanStats(),
      pro_ai: emptyPlanStats(),
      sprint: emptyPlanStats(),
      tester: emptyPlanStats(),
      admin: emptyPlanStats(),
    };

    for (const row of allStepsByLog) {
      const userId = userIdByLogId.get(row.usageLogId);
      const plan = userId ? planById.get(userId) : undefined;
      if (plan && plan in tokensByPlan) {
        tokensByPlan[plan].inputTokens += row._sum.inputTokens ?? 0;
        tokensByPlan[plan].outputTokens += row._sum.outputTokens ?? 0;
      }
    }

    for (const row of allCountsByUser) {
      const plan = planById.get(row.userId);
      if (plan && plan in tokensByPlan) {
        tokensByPlan[plan].questionsGenerated += row._sum.count ?? 0;
      }
    }

    // Build tokensByAction: resolve usageLogId → action, then aggregate steps per (action, step)
    const stepLogIds = stepGroups.map((s) => s.usageLogId);
    const stepLogRows = await prisma.usageLog.findMany({
      where: { id: { in: stepLogIds } },
      select: { id: true, action: true },
    });
    const actionByLogId = new Map(stepLogRows.map((l) => [l.id, l.action]));

    const tokensByAction: Record<string, AdminActionStats> = {};

    for (const actionGroup of actionGroups) {
      const action = actionGroup.action;
      tokensByAction[action] = {
        inputTokens: 0,
        outputTokens: 0,
        count: actionGroup._sum.count ?? 0,
        avgDurationMs: Math.round(actionGroup._avg.totalDurationMs ?? 0),
        steps: {},
      };
    }

    const stepAccum: Record<
      string,
      Record<string, { inputTokens: number; outputTokens: number; durationSum: number; durationCount: number }>
    > = {};
    for (const row of stepGroups) {
      const action = actionByLogId.get(row.usageLogId);
      if (!action) continue;
      if (!stepAccum[action]) stepAccum[action] = {};
      if (!stepAccum[action][row.step])
        stepAccum[action][row.step] = { inputTokens: 0, outputTokens: 0, durationSum: 0, durationCount: 0 };
      const acc = stepAccum[action][row.step];
      acc.inputTokens += row._sum.inputTokens ?? 0;
      acc.outputTokens += row._sum.outputTokens ?? 0;
      acc.durationSum += row._avg.durationMs ?? 0;
      acc.durationCount += 1;

      if (!tokensByAction[action]) {
        tokensByAction[action] = { inputTokens: 0, outputTokens: 0, count: 0, avgDurationMs: 0, steps: {} };
      }
      tokensByAction[action].inputTokens += row._sum.inputTokens ?? 0;
      tokensByAction[action].outputTokens += row._sum.outputTokens ?? 0;
    }

    for (const [action, steps] of Object.entries(stepAccum)) {
      for (const [step, acc] of Object.entries(steps)) {
        tokensByAction[action].steps[step] = {
          inputTokens: acc.inputTokens,
          outputTokens: acc.outputTokens,
          count: acc.durationCount,
          avgDurationMs: acc.durationCount > 0 ? Math.round(acc.durationSum / acc.durationCount) : 0,
        };
      }
    }

    // How much of their period quota users actually consume, per plan — the number that
    // decides whether a plan's questionsPerPeriod is priced for realistic usage or only
    // stays profitable on breakage. See the pricing tier audit's closing callout.
    const questionCountsByPlan: Record<UserPlan, number[]> = {
      free: [],
      pro: [],
      pro_ai: [],
      sprint: [],
      tester: [],
      admin: [],
    };

    for (const u of allUsers) {
      const p = u.plan as UserPlan;
      if (p in questionCountsByPlan) questionCountsByPlan[p].push(u.questionsGeneratedThisPeriod);
    }

    const usagePercentilesByPlan = Object.fromEntries(
      Object.entries(questionCountsByPlan).map(([plan, counts]) => {
        const sorted = [...counts].sort((a, b) => a - b);

        return [
          plan,
          {
            count: sorted.length,
            p50: percentile(sorted, 50),
            p75: percentile(sorted, 75),
            p90: percentile(sorted, 90),
          },
        ];
      })
    ) as Record<UserPlan, { count: number; p50: number; p75: number; p90: number }>;

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
      tokensByAction,
      usagePercentilesByPlan,
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
            OR: [{ email: { contains: search } }, { name: { contains: search } }],
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
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);
    const [countsByUser, stepsByLog] = await Promise.all([
      prisma.usageLog.groupBy({
        by: ['userId'],
        _sum: { count: true },
        where: { userId: { in: userIds }, action: 'generate_questions' },
      }),
      prisma.usageLogStep.groupBy({
        by: ['usageLogId'],
        _sum: { inputTokens: true, outputTokens: true },
        where: { usageLog: { userId: { in: userIds } } },
      }),
    ]);

    // Resolve usageLogId → userId
    const logIdsPage = stepsByLog.map((s) => s.usageLogId);
    const logsPage = await prisma.usageLog.findMany({
      where: { id: { in: logIdsPage } },
      select: { id: true, userId: true },
    });
    const userIdByLogIdPage = new Map(logsPage.map((l) => [l.id, l.userId]));

    const tokenMap = new Map<string, { inputTokens: number; outputTokens: number; count: number }>();
    for (const uid of userIds) {
      tokenMap.set(uid, { inputTokens: 0, outputTokens: 0, count: 0 });
    }
    for (const row of stepsByLog) {
      const uid = userIdByLogIdPage.get(row.usageLogId);
      if (uid && tokenMap.has(uid)) {
        const entry = tokenMap.get(uid)!;
        entry.inputTokens += row._sum.inputTokens ?? 0;
        entry.outputTokens += row._sum.outputTokens ?? 0;
      }
    }
    for (const row of countsByUser) {
      if (tokenMap.has(row.userId)) {
        tokenMap.get(row.userId)!.count += row._sum.count ?? 0;
      }
    }

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
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
      },
    });

    const [, countTotals, stepTotals] = await Promise.all([
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
        _sum: { count: true },
      }),
      prisma.usageLogStep.aggregate({
        where: { usageLog: { userId: targetId } },
        _sum: { inputTokens: true, outputTokens: true },
      }),
    ]);

    return {
      ...updated,
      plan: updated.plan as UserPlan,
      periodStartDate: updated.periodStartDate.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      totalInputTokens: stepTotals._sum.inputTokens ?? 0,
      totalOutputTokens: stepTotals._sum.outputTokens ?? 0,
      totalQuestionsGeneratedAllTime: countTotals._sum.count ?? 0,
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
