import { PLAN_LIMITS } from '@/config/constants';
import type { UserPlan } from '@/shared/types';

export function resolvePlanFromPriceId(priceId: string | undefined): UserPlan {
  const proAiPrices = [
    process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY,
    process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY,
  ].filter(Boolean);

  return proAiPrices.includes(priceId) ? 'pro_ai' : 'pro';
}

// A plan change only deserves a fresh 30-day window when it actually raises the
// questions/period ceiling — otherwise a routine subscription.updated (payment retry,
// cancel_at_period_end toggle) or a downgrade would reset the counter for free.
// Compares PLAN_LIMITS, not customQuotaOverride, since this is about the tier just
// purchased. An unrecognized old plan counts as zero capacity so any real paid tier
// reads as an upgrade.
export function isCapacityUpgrade(oldPlan: string, newPlan: UserPlan): boolean {
  const oldLimit = PLAN_LIMITS[oldPlan as UserPlan]?.questionsPerPeriod ?? 0;
  const newLimit = PLAN_LIMITS[newPlan].questionsPerPeriod;

  return newLimit > oldLimit;
}
