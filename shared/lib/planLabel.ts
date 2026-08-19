import type { UserPlan } from '@/shared/types';

const PLAN_BADGE_KEYS: Partial<Record<UserPlan, string>> = {
  free: 'billing.badge.free',
  pro: 'billing.badge.pro',
  pro_ai: 'billing.badge.proAi',
};

export function getPlanLabel(plan: UserPlan, t: (key: string) => string): string {
  const key = PLAN_BADGE_KEYS[plan];

  return key ? t(key) : plan;
}
