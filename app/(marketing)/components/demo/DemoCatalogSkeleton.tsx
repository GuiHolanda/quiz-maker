'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import { DemoStepHeader } from './DemoStepHeader';

const PLACEHOLDER_CARDS = [0, 1, 2, 3];

interface DemoCatalogSkeletonProps {
  // The Suspense fallback is the server-rendered shell and owns the page's single <h1>.
  // The client component renders this same skeleton again while it fetches the catalog —
  // that one passes "presentational" so the document never carries two identical H1s.
  readonly as?: 'h1' | 'presentational';
}

export function DemoCatalogSkeleton({ as = 'h1' }: DemoCatalogSkeletonProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <DemoStepHeader
          as={as}
          kick={t('demo.step1.kick')}
          heading={t('demo.step1.heading')}
          subtext={t('demo.catalog.loading')}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8" aria-hidden="true">
        {PLACEHOLDER_CARDS.map((index) => (
          <div key={index} className="relative border border-mkt-divider p-6">
            <BlueprintCorners />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex-shrink-0 bg-mkt-surface border border-mkt-divider" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-mkt-surface w-3/4" />
                <div className="h-3 bg-mkt-surface w-1/2" />
              </div>
            </div>

            <div className="border-y border-mkt-divider my-4 py-4 flex gap-4">
              <div className="h-3 bg-mkt-surface w-20" />
              <div className="h-3 bg-mkt-surface w-16" />
              <div className="h-3 bg-mkt-surface w-24" />
            </div>

            <div className="space-y-2">
              <div className="h-3 bg-mkt-surface w-full" />
              <div className="h-3 bg-mkt-surface w-5/6" />
              <div className="h-3 bg-mkt-surface w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
