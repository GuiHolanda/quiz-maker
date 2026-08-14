'use client';

import { Accordion, AccordionItem } from '@heroui/accordion';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

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
    <section id="faq" className="scroll-mt-24 py-20 bg-[var(--color-surface)] border-t border-[var(--color-divider)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">FAQ</span>
        <h2 className="ds-heading text-[var(--color-text)] text-3xl mt-1 mb-12">{t('homepage.faq.title')}</h2>

        <Accordion
          className="gap-0 flex flex-col"
          itemClasses={{
            base: 'border-b border-[var(--color-divider)] bg-transparent border-x-0 border-t-0 first:border-t first:border-[var(--color-divider)]',
            title: 'text-sm font-semibold text-[var(--color-text)] ds-heading',
            trigger: 'px-0 py-4 hover:bg-transparent data-[hover=true]:bg-transparent',
            content: 'px-0 pb-5 text-sm text-[var(--color-text)] opacity-60 leading-relaxed',
            indicator: 'text-[var(--color-text)] opacity-40',
          }}
        >
          {FAQ_KEYS.map((item) => (
            <AccordionItem key={item.q} title={t(item.q)}>
              {t(item.a)}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
