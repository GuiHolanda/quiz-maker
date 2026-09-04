'use client';

import type { UserPlan } from '@/shared/types';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { getCheckoutUrl, getPortalUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

type BillingPeriod = 'monthly' | 'yearly';
type SwitchablePlan = 'free' | 'pro' | 'pro_ai';

interface PlanFeature {
  readonly key: string;
  readonly value?: string;
}

interface PlanEntry {
  readonly id: SwitchablePlan;
  readonly nameKey: string;
  readonly priceKeys: Record<BillingPeriod, string>;
  readonly totalKey: string | null;
  readonly features: readonly PlanFeature[];
}

const PLANS: readonly PlanEntry[] = [
  {
    id: 'free',
    nameKey: 'billing.planFree',
    priceKeys: { monthly: 'pricing.plan.free.price', yearly: 'pricing.plan.free.price' },
    totalKey: null,
    features: [
      { key: 'pricing.features.questionsPerMonth', value: 'pricing.features.free.questions' },
      { key: 'pricing.features.customExams', value: 'pricing.features.free.certifications' },
      { key: 'pricing.features.aiExplanations' },
      { key: 'pricing.features.simulados' },
    ],
  },
  {
    id: 'pro',
    nameKey: 'billing.planPro',
    priceKeys: { monthly: 'pricing.plan.pro.monthly', yearly: 'pricing.plan.pro.yearly' },
    totalKey: 'pricing.plan.pro.yearlyTotal',
    features: [
      { key: 'pricing.features.questionsPerMonth', value: 'pricing.features.pro.questions' },
      { key: 'pricing.features.customExams', value: 'pricing.features.pro.certifications' },
      { key: 'pricing.features.canEditExams' },
      { key: 'pricing.features.topicDistribution' },
    ],
  },
  {
    id: 'pro_ai',
    nameKey: 'billing.planProAi',
    priceKeys: { monthly: 'pricing.plan.proAi.monthly', yearly: 'pricing.plan.proAi.yearly' },
    totalKey: 'pricing.plan.proAi.yearlyTotal',
    features: [
      { key: 'pricing.features.questionsPerMonth', value: 'pricing.features.proAi.questions' },
      { key: 'pricing.features.customExams', value: 'pricing.features.proAi.certifications' },
      { key: 'pricing.features.aiChat' },
      { key: 'pricing.features.canEditExams' },
    ],
  },
];

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, pro_ai: 2, sprint: 2 };

interface PlanSwitcherProps {
  readonly currentPlan: UserPlan;
  readonly hasStripeSubscription: boolean;
}

export function PlanSwitcher({ currentPlan, hasStripeSubscription }: PlanSwitcherProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [loadingId, setLoadingId] = useState<SwitchablePlan | null>(null);

  const canManageViaPortal = hasStripeSubscription;

  function resolveCta(planId: SwitchablePlan): {
    label: string;
    disabled: boolean;
    action: 'none' | 'checkout' | 'portal';
    emphasis: 'primary' | 'secondary';
  } {
    const currentCta = {
      label: t('billing.switch.currentCta'),
      disabled: true,
      action: 'none' as const,
      emphasis: 'secondary' as const,
    };

    if (planId === currentPlan) return currentCta;
    if (currentPlan === 'tester' || currentPlan === 'admin') return currentCta;

    const isUpgrade = (PLAN_RANK[planId] ?? 0) > (PLAN_RANK[currentPlan] ?? 0);

    if (planId !== 'free' && !canManageViaPortal) {
      return { label: t('billing.switch.upgradeCta'), disabled: false, action: 'checkout', emphasis: 'primary' };
    }

    if (planId === 'free' && !canManageViaPortal) {
      return { label: t('billing.switch.downgradeCta'), disabled: true, action: 'none', emphasis: 'secondary' };
    }

    return isUpgrade
      ? { label: t('billing.switch.upgradeCta'), disabled: false, action: 'portal', emphasis: 'primary' }
      : { label: t('billing.switch.downgradeCta'), disabled: false, action: 'portal', emphasis: 'secondary' };
  }

  async function handleCta(planId: SwitchablePlan, action: 'none' | 'checkout' | 'portal') {
    if (action === 'none') return;

    setLoadingId(planId);
    try {
      const url =
        action === 'checkout' ? await getCheckoutUrl(period, planId as 'pro' | 'pro_ai') : await getPortalUrl();

      window.location.href = url;
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
      setLoadingId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('billing.switch.title')}</h2>
          <p className="mt-1 text-sm text-default-500">{t('billing.switch.subtitle')}</p>
        </div>
        <div className="flex rounded-lg border border-divider bg-content1 p-1">
          {(['monthly', 'yearly'] as const).map((option) => (
            <button
              key={option}
              className={`rounded-md px-4 py-2 text-[13px] font-semibold transition-colors duration-200 ${
                period === option ? 'bg-primary text-primary-foreground' : 'text-default-500 hover:text-foreground'
              }`}
              type="button"
              onClick={() => setPeriod(option)}
            >
              {t(option === 'monthly' ? 'billing.switch.monthly' : 'billing.switch.yearly')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const cta = resolveCta(plan.id);
          const isCurrent = plan.id === currentPlan;
          const isFree = plan.id === 'free';
          const billingNote = isFree
            ? t('billing.switch.freeBilling')
            : period === 'yearly' && plan.totalKey
              ? t('billing.switch.billedYearly', { total: t(plan.totalKey) })
              : t('billing.switch.billedMonthly');

          return (
            <div
              key={plan.id}
              className={`rounded-xl border bg-content1 p-6 ${isCurrent ? 'border-primary' : 'border-divider'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[17px] font-bold text-foreground">{t(plan.nameKey)}</span>
                {isCurrent && (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {t('billing.switch.seuPlano')}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl tracking-tight text-foreground">{t(plan.priceKeys[period])}</span>
                {!isFree && <span className="text-[13px] text-default-500">{t('billing.switch.perMonth')}</span>}
              </div>
              <p className="mt-1 text-xs text-default-400">{billingNote}</p>

              <div className="mt-4 flex flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <div key={feature.key} className="flex items-center gap-2.5 text-[13px] text-default-500">
                    <FontAwesomeIcon className="h-3 w-3 shrink-0 text-primary" icon={faCheck} />
                    <span>{feature.value ? `${t(feature.value)} ${t(feature.key)}` : t(feature.key)}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`mt-5 w-full ${cta.emphasis === 'primary' ? buttonStyles.primary : buttonStyles.secondary}`}
                isDisabled={cta.disabled}
                isLoading={loadingId === plan.id}
                variant={cta.emphasis === 'primary' ? undefined : 'bordered'}
                onPress={() => handleCta(plan.id, cta.action)}
              >
                {cta.label}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
