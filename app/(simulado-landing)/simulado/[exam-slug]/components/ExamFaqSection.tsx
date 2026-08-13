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
    <section data-theme="dark" id="faq" className="scroll-mt-20 bg-background py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        <div className="text-center flex flex-col gap-3">
          <h2 className="font-playfair font-extrabold text-white text-2xl sm:text-3xl">
            {t('landing.faq.heading')}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {config.faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="bg-content1 border border-divider rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-content2 transition-colors duration-200"
                  onClick={() => toggle(index)}
                >
                  <span className="font-semibold text-foreground text-sm sm:text-base pr-6">{faq.question}</span>
                  <FontAwesomeIcon
                    className={`text-default-400 text-xs shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    icon={faChevronDown}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6">
                    <p className="text-default-500 text-sm leading-relaxed">{faq.answer}</p>
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
