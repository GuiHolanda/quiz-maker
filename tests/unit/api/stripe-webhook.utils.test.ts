import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { resolvePlanFromPriceId, isCapacityUpgrade } from '@/app/api/webhooks/stripe/stripe-webhook.utils';

describe('resolvePlanFromPriceId', () => {
  const originalMonthly = process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY;
  const originalYearly = process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY;

  beforeEach(() => {
    process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY = 'price_ai_monthly';
    process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY = 'price_ai_yearly';
  });

  afterEach(() => {
    if (originalMonthly === undefined) delete process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY;
    else process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY = originalMonthly;

    if (originalYearly === undefined) delete process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY;
    else process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY = originalYearly;
  });

  it('returns pro_ai for the pro_ai monthly price id', () => {
    expect(resolvePlanFromPriceId('price_ai_monthly')).toBe('pro_ai');
  });

  it('returns pro_ai for the pro_ai yearly price id', () => {
    expect(resolvePlanFromPriceId('price_ai_yearly')).toBe('pro_ai');
  });

  it('returns pro for any other price id (e.g. pro monthly)', () => {
    expect(resolvePlanFromPriceId('price_pro_monthly')).toBe('pro');
  });

  it('returns pro when priceId is undefined', () => {
    expect(resolvePlanFromPriceId(undefined)).toBe('pro');
  });

  it('returns pro when env vars are unset (price id is not in an empty list)', () => {
    delete process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY;
    delete process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY;

    expect(resolvePlanFromPriceId('price_ai_monthly')).toBe('pro');
  });
});

describe('isCapacityUpgrade', () => {
  it('returns true on free → pro (100 → 1000)', () => {
    expect(isCapacityUpgrade('free', 'pro')).toBe(true);
  });

  it('returns true on free → pro_ai (100 → 2000)', () => {
    expect(isCapacityUpgrade('free', 'pro_ai')).toBe(true);
  });

  it('returns true on pro → pro_ai (1000 → 2000)', () => {
    expect(isCapacityUpgrade('pro', 'pro_ai')).toBe(true);
  });

  it('returns false on pro_ai → pro downgrade (2000 → 1000)', () => {
    expect(isCapacityUpgrade('pro_ai', 'pro')).toBe(false);
  });

  it('returns false on pro → pro (payment retry, no plan change)', () => {
    expect(isCapacityUpgrade('pro', 'pro')).toBe(false);
  });

  it('returns false on pro_ai → pro_ai (cancel_at_period_end toggle)', () => {
    expect(isCapacityUpgrade('pro_ai', 'pro_ai')).toBe(false);
  });

  it('returns true for unrecognized old plan (treated as zero capacity)', () => {
    expect(isCapacityUpgrade('unknown_legacy_plan', 'pro')).toBe(true);
  });
});
