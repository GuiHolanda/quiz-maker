'use client';

import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const FAQ_ITEMS = [
  { q: 'pricing.faq.q1', a: 'pricing.faq.a1' },
  { q: 'pricing.faq.q2', a: 'pricing.faq.a2' },
  { q: 'pricing.faq.q3', a: 'pricing.faq.a3' },
  { q: 'pricing.faq.q4', a: 'pricing.faq.a4' },
  { q: 'pricing.faq.q5', a: 'pricing.faq.a5' },
] as const;

interface FaqItemProps {
  readonly question: string;
  readonly answer: string;
  readonly index: number;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

function FaqItem({ question, answer, index, isOpen, onToggle }: FaqItemProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const id = `faq-item-${index}`;

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors duration-200 ${isOpen ? 'border-navy-600 bg-navy-950/60' : 'border-navy-700/60 bg-navy-950/30 hover:border-navy-600/60'}`}>
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset rounded-xl"
        onClick={onToggle}
      >
        <span className="font-sora font-semibold text-sm sm:text-base text-white leading-snug">{question}</span>
        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${isOpen ? 'bg-accent/20 text-accent' : 'bg-navy-800 text-navy-400'}`}>
          <FontAwesomeIcon icon={isOpen ? faMinus : faPlus} className="text-xs" />
        </span>
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? (bodyRef.current?.scrollHeight ?? 500) : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-6 pb-5 pt-1">
          <p className="text-sm text-navy-300 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function PricingFaq() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  const leftItems = FAQ_ITEMS.filter((_, i) => i % 2 === 0);
  const rightItems = FAQ_ITEMS.filter((_, i) => i % 2 !== 0);
  const leftIndices = FAQ_ITEMS.map((_, i) => i).filter((i) => i % 2 === 0);
  const rightIndices = FAQ_ITEMS.map((_, i) => i).filter((i) => i % 2 !== 0);

  return (
    <section className="py-20 px-6 bg-navy-900">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl mb-3">{t('pricing.faq.title')}</h2>
          <p className="text-sm text-navy-400">{t('pricing.faq.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-x-6 lg:gap-y-3">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            {leftItems.map((item, colIdx) => {
              const globalIdx = leftIndices[colIdx];
              return (
                <FaqItem
                  key={item.q}
                  index={globalIdx}
                  question={t(item.q)}
                  answer={t(item.a)}
                  isOpen={openIndex === globalIdx}
                  onToggle={() => toggle(globalIdx)}
                />
              );
            })}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {rightItems.map((item, colIdx) => {
              const globalIdx = rightIndices[colIdx];
              return (
                <FaqItem
                  key={item.q}
                  index={globalIdx}
                  question={t(item.q)}
                  answer={t(item.a)}
                  isOpen={openIndex === globalIdx}
                  onToggle={() => toggle(globalIdx)}
                />
              );
            })}

            {/* Support nudge */}
            <div className="rounded-xl border border-navy-700/60 bg-navy-950/30 px-6 py-5">
              <p className="text-sm font-semibold text-white mb-1">{t('pricing.faq.contactTitle')}</p>
              <p className="text-sm text-navy-400">{t('pricing.faq.contactDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
