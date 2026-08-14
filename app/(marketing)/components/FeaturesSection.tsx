'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const FEATURES = [
  { num: '01', titleKey: 'homepage.features.simple.n1.title', bodyKey: 'homepage.features.simple.n1.body' },
  { num: '02', titleKey: 'homepage.features.simple.n2.title', bodyKey: 'homepage.features.simple.n2.body' },
  { num: '03', titleKey: 'homepage.features.simple.n3.title', bodyKey: 'homepage.features.simple.n3.body' },
] as const;

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="scroll-mt-24 py-20 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('homepage.features.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-12">{t('homepage.features.title')}</h2>

        <div className="grid sm:grid-cols-3 gap-px bg-mkt-divider border border-mkt-divider">
          {FEATURES.map((f) => (
            <div key={f.num} className="bg-mkt-bg p-7">
              <span className="kick" style={{ color: 'var(--color-accent-700)' }}>{f.num}</span>
              <h3 className="ds-heading text-mkt-text text-xl mt-3 mb-2">{t(f.titleKey)}</h3>
              <p className="text-sm text-mkt-text opacity-60 leading-relaxed">{t(f.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
