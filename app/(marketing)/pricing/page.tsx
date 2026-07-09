'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import Image from 'next/image';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { PricingCard } from '@/app/(marketing)/pricing/components/PricingCard';
import { FeatureComparisonTable } from '@/app/(marketing)/pricing/components/FeatureComparisonTable';
import { PricingFaq } from '@/app/(marketing)/pricing/components/PricingFaq';
import { getCheckoutUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

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
    if (userPlan === 'pro_ai') return 'pricing.cta.currentPlan';
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
    <div className="bg-background text-foreground">
      {renderHero()}
      {renderCards()}
      {renderComparisonTable()}
      <PricingFaq />
      {renderBottomCta()}
    </div>
  );

  function renderHero() {
    return (
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <span className="text-xs font-semibold text-primary">{t('pricing.hero.sectionLabel')}</span>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground">
            {t('pricing.hero.title')}
          </h1>
          <p className="text-base text-default-500 leading-relaxed max-w-xl">
            {t('pricing.hero.subtitle')}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Tabs
              aria-label={t('pricing.toggle.monthly')}
              classNames={{
                tabList: 'bg-default-100 border border-default-200 rounded-xl p-1 gap-1',
                tab: 'text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold',
                cursor: 'bg-primary rounded-xl',
              }}
              selectedKey={period}
              onSelectionChange={(key) => setPeriod(key as BillingPeriod)}
            >
              <Tab key="monthly" title={t('pricing.toggle.monthly')} />
              <Tab
                key="yearly"
                title={
                  <div className="flex items-center gap-2">
                    <span>{t('pricing.toggle.yearly')}</span>
                    <span className="text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-md">
                      {t('pricing.toggle.savePercent')}
                    </span>
                  </div>
                }
              />
            </Tabs>
          </div>
        </div>
      </section>
    );
  }

  function renderCards() {
    return (
      <section className="px-6 pb-20">
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
      </section>
    );
  }

  function renderComparisonTable() {
    return (
      <section className="py-16 px-6 bg-content1/20">
        <div className="max-w-5xl mx-auto">
          <FeatureComparisonTable />
        </div>
      </section>
    );
  }

  function renderBottomCta() {
    return (
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10 md:p-14 flex flex-col items-center gap-6 text-center">
            <Image alt="CertifiqueAI" className="mb-2" height={40} src="/icon.svg" width={40} />
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              {t('pricing.cta2.title')}
            </h2>
            <p className="text-sm text-default-500 leading-relaxed max-w-xl">
              {t('pricing.cta2.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                as={NextLink}
                className={buttonStyles.primary}
                href="/register"
                size="lg"
              >
                {t('pricing.cta2.button')}
              </Button>
              <Button
                as={NextLink}
                className={buttonStyles.secondary}
                href="/certifications/simulados"
                size="lg"
                variant="bordered"
              >
                {t('homepage.cta.startPracticing')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
