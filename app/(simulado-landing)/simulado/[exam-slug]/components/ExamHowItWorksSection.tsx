'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

interface ExamHowItWorksSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamHowItWorksSection({ config }: ExamHowItWorksSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-background border-y border-divider py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        <div className="text-center flex flex-col gap-4">
          <h2 className="font-playfair font-extrabold text-foreground text-2xl sm:text-3xl lg:text-4xl">
            {t('landing.howItWorks.heading')}
          </h2>
          <p className="text-default-500 text-base sm:text-lg">
            {t('landing.howItWorks.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, index) => (
            <div key={step} className="relative flex flex-col gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="font-sora font-extrabold text-white text-sm">{index + 1}</span>
              </div>
              {index < 3 && (
                <div className="hidden lg:block absolute top-5 left-[calc(100%_-_8px)] z-10 pointer-events-none">
                  <FontAwesomeIcon icon={faArrowRight} className="text-default-400 text-xs" />
                </div>
              )}
              <h3 className="font-bold text-foreground text-base">
                {t(`landing.howItWorks.${step}.title`)}
              </h3>
              <p className="text-default-500 text-sm leading-relaxed">
                {t(`landing.howItWorks.${step}.desc`, { name: config.name })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
