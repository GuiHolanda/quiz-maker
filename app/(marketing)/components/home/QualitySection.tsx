'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

// The review badge (issue #60) and the report action (issue #57) are described
// here before they exist, by decision: both are on the roadmap. The legal notice
// at the bottom is the reason this section had to stop being Portuguese-only.
const CARDS = [
  ['source', 'pipeline'],
  ['review', 'report'],
] as const;

export function QualitySection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-mkt-surface border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div>
            <span className="kick mb-2">{t('homepage.quality.kick')}</span>
            <h2 className="ds-heading text-mkt-text text-2xl mt-2 leading-tight text-balance">
              {t('homepage.quality.title')}
            </h2>
          </div>

          {CARDS.map((column) => (
            <div key={column[0]} className="flex flex-col gap-6">
              {column.map((card) => (
                <div key={card}>
                  <h3 className="ds-heading text-mkt-text text-base mb-1">{t(`homepage.quality.${card}.title`)}</h3>
                  <p className="text-sm text-mkt-text opacity-55 leading-relaxed text-pretty">
                    {t(`homepage.quality.${card}.body`)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="border-t border-mkt-divider mt-8 pt-6 text-xs text-mkt-text opacity-40 leading-relaxed">
          {t('homepage.quality.disclaimer')}
        </p>
      </div>
    </section>
  );
}
