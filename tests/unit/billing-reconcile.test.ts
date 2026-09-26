import {
  isPlanReconciled,
  resolveReconcileTarget,
  resolveSettledToast,
} from '@/app/(workspace)/billing/components/billingReconcile';

describe('isPlanReconciled', () => {
  describe('checkout return without a session id, matched by the purchased plan', () => {
    it('RN-04: is done on the first read when the webhook landed before the redirect and the token already caught up', () => {
      expect(isPlanReconciled('pro', { expectedPlan: 'pro', previousPlan: 'pro' })).toBe(true);
    });

    it('RN-04: is done when the webhook landed but the token still carries the old plan', () => {
      expect(isPlanReconciled('pro', { expectedPlan: 'pro', previousPlan: 'free' })).toBe(true);
    });

    it('RN-04: keeps waiting while the database still holds a plan other than the purchased one', () => {
      expect(isPlanReconciled('free', { expectedPlan: 'pro', previousPlan: 'free' })).toBe(false);
      expect(isPlanReconciled('sprint', { expectedPlan: 'pro_ai', previousPlan: 'sprint' })).toBe(false);
    });

    it('RN-04: falls back to a plan change when the return URL predates the purchased-plan param', () => {
      expect(isPlanReconciled('pro', { expectedPlan: null, previousPlan: 'free' })).toBe(true);
      expect(isPlanReconciled('free', { expectedPlan: null, previousPlan: 'free' })).toBe(false);
    });
  });

  describe('portal return with the plan the Stripe subscription grants', () => {
    it('RN-05: is done once the database holds the plan Stripe reports', () => {
      expect(isPlanReconciled('pro_ai', { expectedPlan: 'pro_ai', previousPlan: 'pro' })).toBe(true);
    });

    it('RN-05: keeps waiting while the webhook has not recorded the plan Stripe already reports', () => {
      expect(isPlanReconciled('pro', { expectedPlan: 'pro_ai', previousPlan: 'pro' })).toBe(false);
    });
  });
});

describe('resolveReconcileTarget', () => {
  it('RN-04: expects the purchased plan on a checkout return, whatever Stripe reports for the old subscription', () => {
    const target = resolveReconcileTarget(
      { isUpgradeFlow: true, purchasedPlan: 'pro', previousPlan: 'free' },
      null,
      'free'
    );

    expect(target).toEqual({ expectedPlan: 'pro', previousPlan: 'free' });
  });

  it('RN-05: expects the plan Stripe reports on a portal return, so a pending webhook keeps the check running', () => {
    const target = resolveReconcileTarget(
      { isUpgradeFlow: false, purchasedPlan: null, previousPlan: 'pro' },
      'pro_ai',
      'pro'
    );

    expect(isPlanReconciled('pro', target)).toBe(false);
    expect(isPlanReconciled('pro_ai', target)).toBe(true);
  });

  it('RN-05: settles a portal return at once when Stripe and the database already agree', () => {
    const target = resolveReconcileTarget(
      { isUpgradeFlow: false, purchasedPlan: null, previousPlan: 'pro' },
      'pro',
      'pro'
    );

    expect(isPlanReconciled('pro', target)).toBe(true);
  });

  it('RN-05: settles a portal return at once when there is no Stripe subscription to compare against', () => {
    const target = resolveReconcileTarget(
      { isUpgradeFlow: false, purchasedPlan: null, previousPlan: 'sprint' },
      null,
      'sprint'
    );

    expect(isPlanReconciled('sprint', target)).toBe(true);
  });
});

describe('resolveSettledToast', () => {
  it('RN-06: names the plan now active on a checkout return', () => {
    expect(resolveSettledToast(true, 'free', 'pro')).toEqual({ kind: 'upgraded', plan: 'pro' });
  });

  it('RN-06: announces a portal change that raises the question ceiling', () => {
    expect(resolveSettledToast(false, 'pro', 'pro_ai')).toEqual({ kind: 'planUpdated' });
  });

  it('RN-06: stays quiet on a portal downgrade or a visit without a plan change', () => {
    expect(resolveSettledToast(false, 'pro_ai', 'pro')).toBeNull();
    expect(resolveSettledToast(false, 'pro', 'pro')).toBeNull();
  });
});
