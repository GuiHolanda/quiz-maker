import type { UserPlan } from '@/shared/types';

export function resolvePlanFromPriceId(priceId: string | undefined): UserPlan {
  const proAiPrices = [
    process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY,
    process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY,
  ].filter(Boolean);

  return proAiPrices.includes(priceId) ? 'pro_ai' : 'pro';
}
