import type { UserPlan, UserAdminRow, AdminOverviewStats, AdminAuditEntry } from '@/shared/types';

import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/config/constants';

export class AdminService {
  async getOverview(): Promise<AdminOverviewStats> {
    const [allUsers, usageLogs] = await Promise.all([
      prisma.user.findMany({ select: { plan: true, questionsGeneratedThisPeriod: true, subscriptionStatus: true } }),
      prisma.usageLog.aggregate({ _sum: { count: true }, where: { action: 'generate_questions' } }),
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

    return {
      totalUsers: allUsers.length,
      byPlan,
      activeSubscriptions,
      totalQuestionsGenerated: usageLogs._sum.count ?? 0,
      avgUsagePercent: Math.round(avgUsagePercent),
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

    return {
      users: users.map((u) => ({
        ...u,
        periodStartDate: u.periodStartDate.toISOString(),
        createdAt: u.createdAt.toISOString(),
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

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        targetId,
        action: data.plan && data.plan !== before.plan ? 'change_plan' : 'set_quota_override',
        before: JSON.stringify({ plan: before.plan, customQuotaOverride: before.customQuotaOverride }),
        after: JSON.stringify({ plan: updated.plan, customQuotaOverride: updated.customQuotaOverride }),
      },
    });

    return {
      ...updated,
      periodStartDate: updated.periodStartDate.toISOString(),
      createdAt: updated.createdAt.toISOString(),
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

    const userIds = [...new Set([...logs.map((l) => l.adminId), ...logs.map((l) => l.targetId)])];
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
