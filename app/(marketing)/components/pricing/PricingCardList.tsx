'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { PricingCard } from '@/app/(marketing)/components/pricing/PricingCard';
import { usePricingPeriod } from '@/app/(marketing)/components/pricing/PricingPeriodContext';
import { getCheckoutUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

type LoadingKey = 'pro' | 'pro_ai' | 'sprint' | null;

interface PricingFeature {
  readonly labelKey: string;
  readonly included: boolean;
  readonly value?: string;
}

const FREE_FEATURES: readonly PricingFeature[] = [
  { labelKey: 'pricing.features.autoConfig', included: false },
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '250' },
  { labelKey: 'pricing.features.customExams', included: true, value: '2' },
  { labelKey: 'pricing.features.canEditExams', included: false },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
];

const PRO_FEATURES: readonly PricingFeature[] = [
  { labelKey: 'pricing.features.autoConfig', included: true, value: '15' },
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '1,000' },
  { labelKey: 'pricing.features.customExams', included: true, value: '6' },
  { labelKey: 'pricing.features.canEditExams', included: true },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
];

const PRO_AI_FEATURES: readonly PricingFeature[] = [
  { labelKey: 'pricing.features.autoConfig', included: true, value: '30' },
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '2,000' },
  { labelKey: 'pricing.features.customExams', included: true, value: '12' },
  { labelKey: 'pricing.features.canEditExams', included: true },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: true },
];

// Sprint is "tudo do Pro AI" for a fixed 90-day term — same feature set, no separate list.
const SPRINT_FEATURES: readonly PricingFeature[] = PRO_AI_FEATURES;

export function PricingCardList() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const { period } = usePricingPeriod();
  const [loading, setLoading] = useState<LoadingKey>(null);

  const userPlan = session?.user?.plan as string | undefined;

  async function handleCheckout(product: 'pro' | 'pro_ai' | 'sprint') {
    if (!session?.user) {
      notify.info(t('pricing.loginRequired.title'), t('pricing.loginRequired.description'));
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setLoading(product);
    try {
      const url = await getCheckoutUrl(product === 'sprint' ? 'once' : period, product);
      window.location.href = url;
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
      setLoading(null);
    }
  }

  function getFreeCtaKey() {
    if (session?.user) return 'pricing.cta.currentPlan';
    return 'pricing.cta.getStarted';
  }

  function getProCtaKey() {
    if (userPlan === 'pro') return 'pricing.cta.currentPlan';
    return 'pricing.cta.upgradePro';
  }

  function getProAiCtaKey() {
    if (userPlan === 'pro_ai') return 'pricing.cta.currentPlan';
    return 'pricing.cta.upgradeProAi';
  }

  function getSprintCtaKey() {
    if (userPlan === 'sprint') return 'pricing.cta.currentPlan';
    return 'pricing.cta.buySprint';
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <PricingCard
        ctaLabelKey={getFreeCtaKey()}
        features={FREE_FEATURES}
        isCurrent={!!session?.user && userPlan === 'free'}
        nameKey="pricing.plan.free"
        planKey="free"
        priceKey="pricing.plan.free.price"
        sublineKey="pricing.plan.free.tagline"
        onCtaPress={() => {
          if (!session?.user) router.push('/register');
        }}
      />
      <PricingCard
        ctaLabelKey={getProCtaKey()}
        features={PRO_FEATURES}
        isCurrent={userPlan === 'pro'}
        isLoading={loading === 'pro'}
        nameKey="pricing.plan.pro"
        planKey="pro"
        priceKey={period === 'monthly' ? 'pricing.plan.pro.monthly' : 'pricing.plan.pro.yearly'}
        sublineKey={period === 'yearly' ? 'pricing.plan.pro.yearlyTotal' : undefined}
        onCtaPress={() => handleCheckout('pro')}
      />
      <PricingCard
        ctaLabelKey={getProAiCtaKey()}
        features={PRO_AI_FEATURES}
        isCurrent={userPlan === 'pro_ai'}
        isLoading={loading === 'pro_ai'}
        isPopular
        nameKey="pricing.plan.proAi"
        planKey="pro_ai"
        priceKey={period === 'monthly' ? 'pricing.plan.proAi.monthly' : 'pricing.plan.proAi.yearly'}
        sublineKey={period === 'yearly' ? 'pricing.plan.proAi.yearlyTotal' : undefined}
        onCtaPress={() => handleCheckout('pro_ai')}
      />
      <PricingCard
        ctaLabelKey={getSprintCtaKey()}
        features={SPRINT_FEATURES}
        isCurrent={userPlan === 'sprint'}
        isLoading={loading === 'sprint'}
        nameKey="pricing.plan.sprint"
        planKey="sprint"
        priceKey="pricing.plan.sprint.price"
        priceSuffixKey="pricing.plan.per90Days"
        sublineKey="pricing.plan.sprint.tagline"
        onCtaPress={() => handleCheckout('sprint')}
      />
    </div>
  );
}
