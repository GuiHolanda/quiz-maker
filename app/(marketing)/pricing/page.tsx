'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { PricingCard } from '@/app/(marketing)/pricing/components/PricingCard';
import { FeatureComparisonTable } from '@/app/(marketing)/pricing/components/FeatureComparisonTable';
import { PricingFaq } from '@/app/(marketing)/pricing/components/PricingFaq';
import { getCheckoutUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

type BillingPeriod = 'monthly' | 'yearly';
type LoadingKey = 'pro' | 'pro_ai' | null;

const FREE_FEATURES = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '250' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '2' },
  { labelKey: 'pricing.features.publicExams', included: false },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
  { labelKey: 'pricing.features.prioritySupport', included: false },
] as const;

const PRO_FEATURES = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '1,500' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '5' },
  { labelKey: 'pricing.features.publicExams', included: true, value: '2' },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
  { labelKey: 'pricing.features.prioritySupport', included: false },
] as const;

const PRO_AI_FEATURES = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '2,500' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '5' },
  { labelKey: 'pricing.features.publicExams', included: true, value: '5' },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.browseQuestions', included: true },
  { labelKey: 'pricing.features.aiChat', included: true },
  { labelKey: 'pricing.features.prioritySupport', included: true },
] as const;

export default function PricingPage() {
  return <PricingPageContent />;
}

function PricingPageContent() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
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

  function getProCtaKey() {
    if (userPlan === 'pro') return 'pricing.cta.currentPlan';
    return 'pricing.cta.upgradePro';
  }

  function getProAiCtaKey() {
    if (userPlan === 'pro_ai') return 'pricing.cta.currentPlan';
    return 'pricing.cta.upgradeProAi';
  }

  function getFreeCtaKey() {
    if (userPlan === 'free' || userPlan === 'tester' || userPlan === 'admin') return 'pricing.cta.currentPlan';
    if (session?.user) return 'pricing.cta.currentPlan';
    return 'pricing.cta.getStarted';
  }

  const proPrice = period === 'monthly' ? t('pricing.plan.pro.monthly') : t('pricing.plan.pro.yearly');
  const proAiPrice = period === 'monthly' ? t('pricing.plan.proAi.monthly') : t('pricing.plan.proAi.yearly');
  const proSubline = period === 'yearly' ? t('pricing.plan.billedAnnually') : undefined;

  return (
    <div className="bg-navy-900 text-foreground">
      <div className="relative overflow-hidden grid-bg">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'rgba(0,212,255,0.04)', filter: 'blur(60px)' }}
        />
        {renderHero()}
        {renderCards()}
      </div>
      {renderComparisonTable()}
      <PricingFaq />
      {renderBottomCta()}
    </div>
  );

  function renderHero() {
    return (
      <section className="py-20 px-6 text-center relative z-10">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h1 className="font-sora font-extrabold text-white text-3xl sm:text-4xl xl:text-5xl leading-tight text-wrap-balance">
            {t('pricing.hero.title')}
          </h1>
          <p className="text-sm text-navy-400 leading-relaxed max-w-xl">{t('pricing.hero.subtitle')}</p>

          <div className="inline-flex items-center border border-navy-700 rounded p-1 mt-2">
            <button
              type="button"
              aria-pressed={period === 'monthly'}
              className={`text-sm px-4 py-2 rounded transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${period === 'monthly' ? 'bg-navy-800 text-foreground' : 'text-navy-400 hover:text-navy-200'}`}
              onClick={() => setPeriod('monthly')}
            >
              {t('pricing.toggle.monthly')}
            </button>
            <button
              type="button"
              aria-pressed={period === 'yearly'}
              className={`text-sm px-4 py-2 rounded transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${period === 'yearly' ? 'bg-navy-800 text-foreground' : 'text-navy-400 hover:text-navy-200'}`}
              onClick={() => setPeriod('yearly')}
            >
              {t('pricing.toggle.yearly')}
              <span className="text-accent">{t('pricing.toggle.savePercent')}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderCards() {
    return (
      <section className="px-6 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingCard
            ctaLabelKey={getFreeCtaKey()}
            features={FREE_FEATURES as unknown as { labelKey: string; included: boolean; value?: string }[]}
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
            features={PRO_FEATURES as unknown as { labelKey: string; included: boolean; value?: string }[]}
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
            features={PRO_AI_FEATURES as unknown as { labelKey: string; included: boolean; value?: string }[]}
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
        <p className="text-center text-xs text-navy-400 mt-6">
          {t('pricing.trust.noCardRequired')}
        </p>
      </section>
    );
  }

  function renderComparisonTable() {
    return (
      <section className="py-16 px-6 bg-navy-950 border-y border-navy-800/40">
        <div className="max-w-5xl mx-auto">
          <FeatureComparisonTable />
        </div>
      </section>
    );
  }

  function renderBottomCta() {
    return (
      <section className="py-20 px-6 bg-navy-950 border-t border-navy-800/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-sora font-extrabold text-white text-2xl sm:text-4xl mb-5">{t('pricing.cta2.title')}</h2>
          <p className="text-sm text-navy-400 mb-8 max-w-lg mx-auto">{t('pricing.cta2.subtitle')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              as={NextLink}
              className="font-semibold text-sm bg-accent hover:bg-electric text-navy-950 rounded tracking-wide transition-colors duration-200"
              href="/register"
              size="lg"
            >
              {t('pricing.cta2.button')}
            </Button>
            <Button
              as={NextLink}
              className="font-medium text-sm text-navy-400 hover:text-white border border-navy-700 hover:border-navy-600 rounded tracking-wide"
              href={session?.user ? '/certifications/simulados' : '/register'}
              size="lg"
              variant="bordered"
            >
              {t('homepage.cta.startPracticing')}
            </Button>
          </div>
          <p className="text-xs text-navy-400 mt-4">{t('pricing.cta2.disclaimer')}</p>
        </div>
      </section>
    );
  }
}
