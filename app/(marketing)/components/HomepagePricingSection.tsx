'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

type PricingFeature = { labelKey: string; included: boolean; value?: string };

const FREE_FEATURES: PricingFeature[] = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '250' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '2' },
  { labelKey: 'pricing.features.publicExams', included: false },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
];

const PRO_FEATURES: PricingFeature[] = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '1,500' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '5' },
  { labelKey: 'pricing.features.publicExams', included: true, value: '2' },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.aiChat', included: false },
];

const PRO_AI_FEATURES: PricingFeature[] = [
  { labelKey: 'pricing.features.questionsPerMonth', included: true, value: '2,500' },
  { labelKey: 'pricing.features.customCertifications', included: true, value: '5' },
  { labelKey: 'pricing.features.publicExams', included: true, value: '5' },
  { labelKey: 'pricing.features.aiExplanations', included: true },
  { labelKey: 'pricing.features.topicDistribution', included: true },
  { labelKey: 'pricing.features.simulados', included: true },
  { labelKey: 'pricing.features.aiChat', included: true },
];

export function HomepagePricingSection() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const userPlan = session?.user?.plan as string | undefined;

  const proPrice = period === 'monthly' ? t('pricing.plan.pro.monthly') : t('pricing.plan.pro.yearly');
  const proAiPrice = period === 'monthly' ? t('pricing.plan.proAi.monthly') : t('pricing.plan.proAi.yearly');
  const billedAnnually = period === 'yearly' ? t('pricing.plan.billedAnnually') : undefined;

  function freeCtaLabel() {
    if (session?.user) return t('pricing.cta.currentPlan');
    return t('pricing.cta.getStarted');
  }
  function proCtaLabel() {
    if (userPlan === 'pro' || userPlan === 'pro_ai') return t('pricing.cta.currentPlan');
    return t('pricing.cta.upgradePro');
  }
  function proAiCtaLabel() {
    if (userPlan === 'pro_ai') return t('pricing.cta.currentPlan');
    return t('pricing.cta.upgradeProAi');
  }

  return (
    <section id="pricing" className="py-20 bg-navy-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-px h-4 bg-accent" />
            <span className="font-mono text-xs text-navy-400 tracking-widest uppercase">
              {t('pricing.hero.sectionLabel')}
            </span>
            <div className="w-px h-4 bg-accent" />
          </div>
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl mb-3">{t('pricing.hero.title')}</h2>
          <p className="text-navy-400 text-base max-w-md mx-auto">{t('pricing.hero.subtitle')}</p>

          {/* Toggle */}
          <div className="inline-flex items-center border border-navy-700 rounded p-1 mt-6">
            <button
              className={`text-sm px-4 py-2 rounded transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${period === 'monthly' ? 'bg-navy-800 text-[#e8edf3]' : 'text-navy-400 hover:text-navy-200'}`}
              type="button"
              aria-pressed={period === 'monthly'}
              onClick={() => setPeriod('monthly')}
            >
              {t('pricing.toggle.monthly')}
            </button>
            <button
              className={`text-sm px-4 py-2 rounded transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${period === 'yearly' ? 'bg-navy-800 text-[#e8edf3]' : 'text-navy-400 hover:text-navy-200'}`}
              type="button"
              aria-pressed={period === 'yearly'}
              onClick={() => setPeriod('yearly')}
            >
              {t('pricing.toggle.yearly')}
              <span className="text-accent">{t('pricing.toggle.savePercent')}</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderCard({
            planLabel: 'Free',
            planName: t('pricing.plan.free'),
            price: t('pricing.plan.free.price'),
            subline: t('pricing.plan.free.tagline'),
            features: FREE_FEATURES,
            ctaLabel: freeCtaLabel(),
            ctaHref: session?.user ? undefined : '/register',
            isHighlighted: false,
          })}
          {renderCard({
            planLabel: 'Pro',
            planName: t('pricing.plan.pro'),
            price: proPrice,
            subline: billedAnnually,
            features: PRO_FEATURES,
            ctaLabel: proCtaLabel(),
            ctaHref: userPlan === 'pro' ? undefined : '/pricing',
            isHighlighted: false,
          })}
          {renderCard({
            planLabel: 'Pro AI',
            planName: t('pricing.plan.proAi'),
            price: proAiPrice,
            subline: billedAnnually,
            features: PRO_AI_FEATURES,
            ctaLabel: proAiCtaLabel(),
            ctaHref: userPlan === 'pro_ai' ? undefined : '/pricing',
            isHighlighted: true,
          })}
        </div>

        <p className="text-center text-xs text-navy-400 mt-6">{t('pricing.trust.noCardRequired')}</p>
      </div>
    </section>
  );

  function renderCard({
    planLabel,
    price,
    subline,
    features,
    ctaLabel,
    ctaHref,
    isHighlighted,
  }: {
    planLabel: string;
    planName: string;
    price: string;
    subline?: string;
    features: PricingFeature[];
    ctaLabel: string;
    ctaHref?: string;
    isHighlighted: boolean;
  }) {
    return (
      <div
        key={planLabel}
        className={`rounded-lg p-7 relative ${
          isHighlighted ? 'bg-navy-950/60 border-2 border-accent/40' : 'bg-navy-950/40 border border-navy-700/60'
        }`}
      >
        {isHighlighted && (
          <div className="absolute top-4 right-4">
            <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
              {t('pricing.plan.mostPopular')}
            </span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-end gap-2">
            <h3 className="font-sora font-extrabold text-white text-3xl">{price}</h3>
            <span className="text-xs text-navy-400 mb-1.5">{t('pricing.plan.perMonth')}</span>
          </div>
          {subline ? (
            <p className="text-xs text-navy-400 mt-1">{subline}</p>
          ) : (
            <p className="text-xs text-navy-600 mt-1">&nbsp;</p>
          )}
        </div>

        <div className="space-y-0 mb-8">
          {features.map((f) => (
            <div key={f.labelKey} className="flex items-center gap-3 py-2.5 border-b border-navy-800/40 last:border-0">
              <FontAwesomeIcon
                className={`text-xs w-4 shrink-0 ${f.included ? 'text-accent' : 'text-navy-700'}`}
                icon={f.included ? faCheck : faXmark}
              />
              <span className={`text-sm ${f.included ? 'text-[#e8edf3]' : 'text-navy-600'}`}>
                {f.value ? `${f.value} ${t(f.labelKey)}` : t(f.labelKey)}
              </span>
            </div>
          ))}
        </div>

        {ctaHref ? (
          <Button
            as={NextLink}
            className={`w-full font-sans font-semibold text-sm rounded tracking-wide ${
              isHighlighted
                ? 'bg-accent hover:bg-electric text-navy-950 transition-colors duration-200'
                : 'text-navy-400 hover:text-white border border-navy-700 hover:border-navy-500'
            }`}
            href={ctaHref}
            variant={isHighlighted ? undefined : 'bordered'}
          >
            {ctaLabel}
            {isHighlighted && <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />}
          </Button>
        ) : (
          <button
            disabled
            className="w-full text-xs text-navy-600 py-3 rounded border border-navy-800/40 cursor-default"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    );
  }
}
