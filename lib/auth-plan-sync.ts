import { prisma } from '@/lib/prisma';

export const PLAN_SYNC_TTL_MS = 5 * 60 * 1000;

export interface PlanToken {
  sub?: string;
  plan?: string;
  sprintExpiresAt?: number | null;
  planSyncedAt?: number;
}

export type PlanSyncTrigger = 'signIn' | 'signUp' | 'update' | undefined;

export async function syncTokenPlan<T extends PlanToken>(
  token: T,
  trigger: PlanSyncTrigger,
  now: number = Date.now()
): Promise<T> {
  if (!token.sub) return token;

  const sprintPastDue = token.plan === 'sprint' && token.sprintExpiresAt != null && now >= token.sprintExpiresAt;
  const ttlExpired = now - (token.planSyncedAt ?? 0) >= PLAN_SYNC_TTL_MS;

  if (token.plan !== undefined && trigger !== 'update' && !ttlExpired && !sprintPastDue) return token;

  let dbUser = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { plan: true, sprintExpiresAt: true },
  });

  if (dbUser?.plan === 'sprint' && dbUser.sprintExpiresAt && dbUser.sprintExpiresAt.getTime() <= now) {
    dbUser = await prisma.user.update({
      where: { id: token.sub },
      data: { plan: 'free', sprintExpiresAt: null },
      select: { plan: true, sprintExpiresAt: true },
    });
  }

  token.plan = dbUser?.plan ?? 'free';
  token.sprintExpiresAt = dbUser?.sprintExpiresAt ? dbUser.sprintExpiresAt.getTime() : null;
  token.planSyncedAt = now;

  return token;
}
