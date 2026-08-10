'use client';

import { useEffect, useState } from 'react';

import { CatalogCard } from './CatalogCard';

import { getCatalogExams } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import type { CatalogExam } from '@/shared/types';

export function CatalogSection() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<CatalogExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCatalogExams()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">{t('catalog.sectionTitle')}</h2>
          <p className="text-sm text-default-500 mt-0.5">{t('catalog.sectionSubtitle')}</p>
        </div>
        <SkeletonListLoader count={3} height="h-36" />
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="mt-10" data-testid="catalog-section">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">{t('catalog.sectionTitle')}</h2>
        <p className="text-sm text-default-500 mt-0.5">{t('catalog.sectionSubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((exam) => (
          <CatalogCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
}
