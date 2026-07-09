'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <section className="py-20 px-6 bg-navy-900">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-accent" />
            <span className="font-mono text-xs text-navy-400 tracking-widest uppercase">FAQ</span>
          </div>
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl">{t('pricing.faq.title')}</h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={item.q}
              className="border border-navy-700/60 rounded-lg overflow-hidden bg-navy-950/40"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-navy-950/60 transition-colors duration-200"
                onClick={() => toggle(i)}
              >
                <span className="font-sora font-semibold text-sm text-white pr-4">{t(item.q)}</span>
                <FontAwesomeIcon
                  className={`text-navy-500 text-xs shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  icon={faChevronDown}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 border-t border-navy-800/40">
                  <p className="font-mono text-xs text-navy-400 leading-relaxed pt-4">{t(item.a)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
