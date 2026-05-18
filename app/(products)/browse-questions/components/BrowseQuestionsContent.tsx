'use client';
import { useEffect, useState } from 'react';
import { Skeleton } from '@heroui/skeleton';
import { addToast } from '@heroui/toast';
import { BrowseCertificationSummary } from '@/shared/types';
import { getBrowseSummary } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { CertificationAccordion } from './CertificationAccordion';

export function BrowseQuestionsContent() {
  const { t } = useTranslation();
  const [certifications, setCertifications] = useState<BrowseCertificationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBrowseSummary()
      .then((data) => setCertifications(data.certifications))
      .catch(() => {
        addToast({ title: t('toast.failedToLoad'), description: t('browse.loadError'), color: 'danger' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const totalQuestions = certifications.reduce((sum, c) => sum + c.totalCount, 0);

  return (
    <PageHeader
      title={t('browse.title')}
      subtitle={
        isLoading
          ? ''
          : t('browse.subtitle', { total: totalQuestions, count: certifications.length })
      }
    >
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </>
        ) : certifications.length === 0 ? (
          <p className="text-default-400 text-sm">{t('browse.noQuestions')}</p>
        ) : (
          certifications.map((cert) => (
            <CertificationAccordion key={cert.key} certification={cert} />
          ))
        )}
      </div>
    </PageHeader>
  );
}
