'use client';

import { Accordion, AccordionItem } from '@heroui/accordion';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const FAQ_ITEMS = [
  { q: 'pricing.faq.q1', a: 'pricing.faq.a1' },
  { q: 'pricing.faq.q2', a: 'pricing.faq.a2' },
  { q: 'pricing.faq.q3', a: 'pricing.faq.a3' },
  { q: 'pricing.faq.q4', a: 'pricing.faq.a4' },
  { q: 'pricing.faq.q5', a: 'pricing.faq.a5' },
] as const;

export function PricingFaq() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <span className="kick mb-2">{t('landing.faq.kick')}</span>
          <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-3">{t('pricing.faq.title')}</h2>
          <p className="text-sm text-mkt-text opacity-60">{t('pricing.faq.subtitle')}</p>
        </div>

        <Accordion
          defaultExpandedKeys={['0']}
          itemClasses={{
            base: 'border-b border-mkt-divider bg-transparent border-x-0 border-t-0 first:border-t',
            title: 'text-lg font-semibold text-mkt-text ds-heading',
            trigger: 'px-0 py-4 hover:bg-transparent',
            content: 'px-0 pb-5 text-base text-mkt-text opacity-60',
            indicator: 'text-mkt-text opacity-40',
          }}
        >
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={String(index)} aria-label={t(item.q)} title={t(item.q)}>
              {t(item.a)}
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 border border-mkt-divider bg-mkt-surface p-6">
          <p className="text-sm font-semibold text-mkt-text mb-1">{t('pricing.faq.contactTitle')}</p>
          <p className="text-sm text-mkt-text opacity-60">{t('pricing.faq.contactDescription')}</p>
        </div>
      </div>
    </section>
  );
}
