'use client';

import { Accordion, AccordionItem } from '@heroui/accordion';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

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

        <Accordion
          className="gap-0 flex flex-col px-0"
          itemClasses={{
            base: 'border-b border-mkt-divider bg-transparent border-x-0 border-t-0 first:border-t first:border-mkt-divider',
            title: 'text-lg font-semibold text-mkt-text ds-heading',
            trigger: 'px-0 py-4 hover:bg-transparent data-[hover=true]:bg-transparent',
            content: 'px-0 pb-5 text-base text-mkt-text opacity-60 leading-relaxed',
            indicator: 'text-mkt-text opacity-40',
          }}
        >
          {config.faqs.map((faq, index) => (
            <AccordionItem key={index} title={faq.question}>
              {faq.answer}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
