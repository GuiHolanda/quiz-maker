import { isPlanReconciled } from '@/app/(workspace)/billing/components/billingReconcile';

describe('isPlanReconciled', () => {
  describe('checkout return with the purchased plan', () => {
    it('is done on the first read when the webhook landed before the redirect and the token already caught up', () => {
      expect(isPlanReconciled('pro', { expectedPlan: 'pro', previousPlan: 'pro' })).toBe(true);
    });

    it('is done when the webhook landed but the token still carries the old plan', () => {
      expect(isPlanReconciled('pro', { expectedPlan: 'pro', previousPlan: 'free' })).toBe(true);
    });

    it('keeps waiting while the database still holds a plan other than the purchased one', () => {
      expect(isPlanReconciled('free', { expectedPlan: 'pro', previousPlan: 'free' })).toBe(false);
      expect(isPlanReconciled('sprint', { expectedPlan: 'pro_ai', previousPlan: 'sprint' })).toBe(false);
    });

    it('falls back to a plan change when the return URL predates the purchased-plan param', () => {
      expect(isPlanReconciled('pro', { expectedPlan: null, previousPlan: 'free' })).toBe(true);
      expect(isPlanReconciled('free', { expectedPlan: null, previousPlan: 'free' })).toBe(false);
    });
  });

  describe('portal return with the plan held before leaving', () => {
    it('is done when the plan differs from the one held before the portal, even if the webhook landed first', () => {
      expect(isPlanReconciled('pro_ai', { expectedPlan: null, previousPlan: 'pro' })).toBe(true);
    });

    it('keeps waiting while the plan is still the one held before the portal', () => {
      expect(isPlanReconciled('pro', { expectedPlan: null, previousPlan: 'pro' })).toBe(false);
    });
  });
});
