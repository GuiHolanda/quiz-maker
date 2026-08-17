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
    <section id="faq" className="scroll-mt-24 py-20 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('landing.faq.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-12">{t('landing.faq.heading')}</h2>

        <FaqAccordion items={config.faqs} />
      </div>
    </section>
  );
}
