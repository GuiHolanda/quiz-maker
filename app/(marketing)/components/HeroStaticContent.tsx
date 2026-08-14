'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { HeroCta } from '@/app/(marketing)/components/HeroCta';

export function HeroStaticContent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="ds-heading text-[var(--color-text)] text-4xl xl:text-5xl leading-tight mb-6">
        {t('homepage.hero.headline')}
      </h1>
      <p className="text-[var(--color-text)] opacity-60 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
        {t('homepage.hero.description')}
      </p>
      <HeroCta />
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {['AB', 'ML', 'RC', 'PK'].map((initials) => (
            <div
              key={initials}
              className="w-8 h-8 border border-[var(--color-divider)] bg-[var(--color-surface)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text)] opacity-70"
            >
              {initials}
            </div>
          ))}
        </div>
        <p className="mono text-xs text-[var(--color-text)] opacity-50">{t('homepage.hero.studyingCount')}</p>
      </div>
    </div>
  );
}
