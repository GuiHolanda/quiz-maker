'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

/**
 * Brand panel shown on the left half of the auth split-screen layout.
 * Hidden below `lg:` so mobile devices see only the form panel.
 */
export function AuthBrandPanel() {
  const { t } = useTranslation();

  return (
    <section className="hidden lg:flex bg-primary text-primary-foreground p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
      <div aria-hidden className="h-8" />

      <div className="flex flex-col gap-7 max-w-xl">
        <h2 className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05]">
          {t('login.brandTitleStart')}{' '}
          <span className="text-secondary inline-block">{t('login.brandTitleAccent')}</span>
        </h2>
        <p className="text-base xl:text-lg text-primary-foreground/75 max-w-md leading-relaxed">
          {t('login.brandSubtitle')}
        </p>
      </div>

      <div aria-hidden className="h-8" />
    </section>
  );
}

/**
 * Wraps the right-side form column with consistent spacing and centering.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      <AuthBrandPanel />
      <section className="flex items-center justify-center px-6 sm:px-10 lg:px-16 py-24 sm:py-28">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </div>
  );
}
