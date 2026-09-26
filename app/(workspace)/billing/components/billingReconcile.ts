export interface ReconcileTarget {
  readonly expectedPlan: string | null;
  readonly previousPlan: string | null;
}

export function isPlanReconciled(currentPlan: string, { expectedPlan, previousPlan }: ReconcileTarget): boolean {
  if (expectedPlan) return currentPlan === expectedPlan;

  return currentPlan !== previousPlan;
}
