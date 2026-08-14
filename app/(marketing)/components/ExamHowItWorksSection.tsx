'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

interface ExamHowItWorksSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamHowItWorksSection({ config }: ExamHowItWorksSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 bg-mkt-surface border-t border-mkt-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('landing.howItWorks.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-3">{t('landing.howItWorks.heading')}</h2>
        <p className="text-mkt-text opacity-60 text-base max-w-2xl mb-12">{t('landing.howItWorks.subheading')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {STEPS.map((step, index) => (
            <div key={step} className={`border-t-2 pt-5 ${index === 0 ? 'border-mkt-accent' : 'border-mkt-divider'}`}>
              <span className="kick">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="ds-heading text-[19px] text-mkt-text mt-3 mb-2">
                {t(`landing.howItWorks.${step}.title`)}
              </h3>
              <p className="text-sm text-mkt-text opacity-55 leading-relaxed">
                {t(`landing.howItWorks.${step}.desc`, { name: config.name })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
