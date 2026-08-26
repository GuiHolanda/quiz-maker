'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamType } from '@/shared/types';

interface CatalogDiscoveryCardProps {
  readonly type: ExamType;
}

export function CatalogDiscoveryCard({ type }: CatalogDiscoveryCardProps) {
  const { t } = useTranslation();

  return (
    <NextLink className="block" href={`/exams/catalog?type=${type}`}>
      <div className="h-[420px] lg:h-[480px] w-full bg-content1 border-2 border-dashed border-default-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center hover:border-default-400 transition-colors cursor-pointer">
        <div className="w-14 h-14 rounded-full bg-content2 flex items-center justify-center">
          <FontAwesomeIcon className="text-default-500" icon={faPlus} size="lg" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-xs">
          <p className="text-base font-bold text-foreground">{t('catalog.discoverTitle')}</p>
          <p className="text-sm text-default-500">{t('catalog.discoverDescription')}</p>
        </div>
      </div>
    </NextLink>
  );
}
