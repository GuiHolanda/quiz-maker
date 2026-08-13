'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

interface ExamFaqSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamFaqSection({ config }: ExamFaqSectionProps) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section className="py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-sora font-bold text-foreground text-2xl sm:text-3xl mb-8 text-center">
          {t('landing.faq.heading')}
        </h2>

        <div className="space-y-2">
          {config.faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="bg-content1 border border-divider rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-content2 transition-colors duration-200"
                  onClick={() => toggle(index)}
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.question}</span>
                  <FontAwesomeIcon
                    className={`text-default-400 text-xs shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    icon={faChevronDown}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-default-500 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
