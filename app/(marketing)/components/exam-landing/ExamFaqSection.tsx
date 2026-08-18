'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { FaqAccordion } from '@/app/(marketing)/components/shared/FaqAccordion';

interface ExamFaqSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamFaqSection({ config }: ExamFaqSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="scroll-mt-24 bg-mkt-bg pb-16" id="faq">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="ds-heading text-mkt-text text-3xl sm:text-4xl mb-5">
          {t('landing.faq.heading', { name: config.name })}
        </h2>

        <div className="max-w-[840px]">
          <FaqAccordion items={config.faqs} />
        </div>
      </div>
    </section>
  );
}
