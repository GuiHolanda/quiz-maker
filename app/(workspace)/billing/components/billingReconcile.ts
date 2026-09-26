import { isCapacityUpgrade } from '@/config/constants';

export interface ReconcileTarget {
  readonly expectedPlan: string | null;
  readonly previousPlan: string | null;
}

export interface BillingReturn {
  readonly isUpgradeFlow: boolean;
  readonly purchasedPlan: string | null;
  readonly previousPlan: string | null;
}

export type SettledToast = { readonly kind: 'upgraded'; readonly plan: string } | { readonly kind: 'planUpdated' };

export function isPlanReconciled(currentPlan: string, { expectedPlan, previousPlan }: ReconcileTarget): boolean {
  if (expectedPlan) return currentPlan === expectedPlan;

  return currentPlan !== previousPlan;
}

export function resolveReconcileTarget(
  { isUpgradeFlow, purchasedPlan, previousPlan }: BillingReturn,
  stripePlan: string | null,
  currentPlan: string
): ReconcileTarget {
  const expectedPlan = isUpgradeFlow ? purchasedPlan : (stripePlan ?? currentPlan);

  return { expectedPlan, previousPlan };
}

export function resolveSettledToast(
  isUpgradeFlow: boolean,
  previousPlan: string | null,
  currentPlan: string
): SettledToast | null {
  if (isUpgradeFlow) return { kind: 'upgraded', plan: currentPlan };

  return isCapacityUpgrade(previousPlan, currentPlan) ? { kind: 'planUpdated' } : null;
}
