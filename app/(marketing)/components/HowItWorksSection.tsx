'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const STEPS = [
  { num: '01', titleKey: 'homepage.howItWorks.step1Title', bodyKey: 'homepage.howItWorks.step1Body' },
  { num: '02', titleKey: 'homepage.howItWorks.step2Title', bodyKey: 'homepage.howItWorks.step2Body' },
  { num: '03', titleKey: 'homepage.howItWorks.step3Title', bodyKey: 'homepage.howItWorks.step3Body' },
  { num: '04', titleKey: 'homepage.howItWorks.step4Title', bodyKey: 'homepage.howItWorks.step4Body' },
] as const;

export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section id="como-funciona" className="scroll-mt-24 py-20 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('homepage.howItWorks.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mb-3 mt-1">{t('homepage.howItWorks.title')}</h2>
        <p className="text-mkt-text opacity-60 text-base max-w-2xl mb-12">{t('homepage.howItWorks.subtitle')}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {STEPS.map((step, i) => (
            <div key={step.num} className={`border-t-2 pt-5 ${i === 0 ? 'border-mkt-accent' : 'border-mkt-divider'}`}>
              <span className="kick">{step.num}</span>
              <h3 className="ds-heading text-[19px] text-mkt-text mt-3 mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-mkt-text opacity-55 leading-relaxed">{t(step.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
