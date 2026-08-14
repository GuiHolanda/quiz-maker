'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { FaqAccordion } from '@/app/(marketing)/components/shared/FaqAccordion';

const FAQ_KEYS = [
  { q: 'homepage.faq.q1', a: 'homepage.faq.a1' },
  { q: 'homepage.faq.q2', a: 'homepage.faq.a2' },
  { q: 'homepage.faq.q3', a: 'homepage.faq.a3' },
  { q: 'homepage.faq.q4', a: 'homepage.faq.a4' },
  { q: 'homepage.faq.q5', a: 'homepage.faq.a5' },
  { q: 'homepage.faq.q6', a: 'homepage.faq.a6' },
  { q: 'homepage.faq.q7', a: 'homepage.faq.a7' },
] as const;

export function FaqSection() {
  const { t } = useTranslation();

  return (
    <section id="faq" className="scroll-mt-24 py-20 border-t border-mkt-divider">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">FAQ</span>
        <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-12">{t('homepage.faq.title')}</h2>

        <FaqAccordion items={FAQ_KEYS.map((item) => ({ question: t(item.q), answer: t(item.a) }))} />
      </div>
    </section>
  );
}
