'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { FaqAccordion } from '@/app/(marketing)/components/shared/FaqAccordion';

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

        <FaqAccordion
          defaultExpandedKeys={['0']}
          items={FAQ_ITEMS.map((item) => ({ question: t(item.q), answer: t(item.a) }))}
        />
      </div>
    </section>
  );
}
