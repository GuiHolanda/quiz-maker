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
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-3 text-center">
          <span className="text-xs font-semibold text-primary">{t('pricing.faq.title')}</span>
          <h2 className="text-3xl font-extrabold text-foreground">{t('pricing.faq.title')}</h2>
        </div>

        <Accordion
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl',
            title: 'text-sm font-bold text-foreground',
            trigger: 'px-6 py-4 hover:bg-default-100 transition-colors duration-200',
            content: 'px-6 pb-6',
            indicator: 'text-default-400',
          }}
          variant="splitted"
        >
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.q} aria-label={t(item.q)} title={t(item.q)}>
              <p className="text-sm text-default-500 leading-relaxed">{t(item.a)}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
