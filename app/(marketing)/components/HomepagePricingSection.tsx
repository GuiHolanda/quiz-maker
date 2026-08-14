'use client';

import NextLink from 'next/link';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function HomepagePricingSection() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const freeCta = session?.user ? t('pricing.cta.currentPlan') : t('homepage.pricing.freeCta');
  const freeHref = session?.user ? undefined : '/register';

  return (
    <section id="pricing" className="py-20 bg-[var(--color-bg)] border-t border-[var(--color-divider)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('homepage.pricing.kick')}</span>
        <h2 className="ds-heading text-[var(--color-text)] text-3xl mt-1 mb-12">
          {t('homepage.pricing.headline')}
        </h2>

        <div className="grid sm:grid-cols-2 gap-px bg-[var(--color-divider)] border border-[var(--color-divider)]">
          <div className="bg-[var(--color-bg)] p-8">
            <span className="kick mb-1">{t('homepage.pricing.freeTitle')}</span>
            <h3 className="ds-heading text-[var(--color-text)] text-2xl mt-2 mb-3">{t('homepage.pricing.freeBody')}</h3>
            <p className="text-sm text-[var(--color-text)] opacity-60 mb-6 leading-relaxed">
              {t('homepage.pricing.freeDescription')}
            </p>
            {freeHref ? (
              <NextLink
                className="inline-flex w-full items-center justify-center text-sm font-medium border border-[var(--color-divider)] text-[var(--color-text)] py-3 hover:bg-[var(--color-surface)] transition-colors"
                href={freeHref}
              >
                {freeCta}
              </NextLink>
            ) : (
              <button
                disabled
                className="w-full text-xs text-[var(--color-text)] opacity-40 py-3 border border-[var(--color-divider)] cursor-default"
              >
                {freeCta}
              </button>
            )}
          </div>

          <div className="bg-[var(--color-surface)] p-8">
            <span className="kick mb-1">{t('homepage.pricing.proTitle')}</span>
            <h3 className="ds-heading text-[var(--color-text)] text-2xl mt-2 mb-3">{t('homepage.pricing.proBody')}</h3>
            <p className="text-sm text-[var(--color-text)] opacity-60 mb-6 leading-relaxed">
              {t('homepage.pricing.proDescription')}
            </p>
            <NextLink
              className="inline-flex w-full items-center justify-center text-sm font-semibold bg-[var(--color-accent)] text-white py-3 hover:opacity-90 transition-opacity"
              href="/pricing"
            >
              {t('homepage.pricing.proCta')}
            </NextLink>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text)] opacity-40 mt-4 text-center">
          {t('homepage.pricing.tagline')}
        </p>
      </div>
    </section>
  );
}
