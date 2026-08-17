'use client';

import NextLink from 'next/link';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

interface DemoCatalogFallbackProps {
  readonly onRetry?: () => void;
  readonly isEmpty?: boolean;
  readonly isQuizError?: boolean;
}

export function DemoCatalogFallback({ onRetry, isEmpty, isQuizError }: DemoCatalogFallbackProps) {
  const { t } = useTranslation();

  const variant = isEmpty ? 'empty' : isQuizError ? 'quiz' : 'catalog';

  const heading = t(`demo.fallback.${variant}Heading`);
  const body = t(`demo.fallback.${variant}Body`);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="relative border border-mkt-divider p-10 w-full max-w-lg text-center">
        <BlueprintCorners />

        <span className="kick">{t('demo.fallback.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-2xl mt-2">{heading}</h2>
        <p className="text-sm text-mkt-text opacity-60 mt-3 leading-relaxed">{body}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-semibold bg-mkt-accent text-white px-6 py-2.5 hover:opacity-90 transition-opacity"
            >
              {t('demo.fallback.retry')}
            </button>
          )}
          <NextLink
            href="/register"
            className="text-sm font-semibold border border-mkt-divider text-mkt-text px-6 py-2.5 hover:border-mkt-accent transition-colors"
          >
            {t('demo.fallback.registerCta')}
          </NextLink>
        </div>
      </div>
    </div>
  );
}
