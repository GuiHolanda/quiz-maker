'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { PricingCard } from '@/app/(marketing)/components/pricing/PricingCard';
import { usePricingPeriod } from '@/app/(marketing)/components/pricing/PricingPeriodContext';
import { getCheckoutUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

type LoadingKey = 'pro' | 'pro_ai' | null;

interface PricingFeature {
  readonly labelKey: string;
  readonly included: boolean;
  readonly value?: string;
}

const FREE_FEATURES: readonly PricingFeature[] = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '250' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '2' },
  { labelKey: 'pricing.features.publicExams', included: false },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
  { labelKey: 'pricing.features.prioritySupport', included: false },
];

const PRO_FEATURES: readonly PricingFeature[] = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '1,500' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '5' },
  { labelKey: 'pricing.features.publicExams', included: true, value: '2' },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
  { labelKey: 'pricing.features.prioritySupport', included: false },
];

const PRO_AI_FEATURES: readonly PricingFeature[] = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '2,500' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '5' },
  { labelKey: 'pricing.features.publicExams', included: true, value: '5' },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: true },
  { labelKey: 'pricing.features.prioritySupport', included: true },
];

export function PricingCardList() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const { period } = usePricingPeriod();
  const [loading, setLoading] = useState<LoadingKey>(null);

  const userPlan = session?.user?.plan as string | undefined;

  async function handleCheckout(product: 'pro' | 'pro_ai') {
    if (!session?.user) {
      notify.info(t('pricing.loginRequired.title'), t('pricing.loginRequired.description'));
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setLoading(product);
    try {
      const url = await getCheckoutUrl(period, product);
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

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <PricingCard
        ctaLabelKey={getFreeCtaKey()}
        features={FREE_FEATURES}
        isCurrent={!!session?.user && userPlan !== 'pro' && userPlan !== 'pro_ai'}
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
        sublineKey={period === 'yearly' ? 'pricing.plan.billedAnnually' : undefined}
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
        sublineKey={period === 'yearly' ? 'pricing.plan.billedAnnually' : undefined}
        onCtaPress={() => handleCheckout('pro_ai')}
      />
    </div>
  );
}
