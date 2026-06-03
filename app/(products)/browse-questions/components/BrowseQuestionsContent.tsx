'use client';
import { useEffect, useState } from 'react';
import type { Selection } from '@react-types/shared';
import { Accordion, AccordionItem } from '@heroui/accordion';
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
  const [openCertKey, setOpenCertKey] = useState<string | null>(null);

  useEffect(() => {
    getBrowseSummary()
      .then((data) => setCertifications(data.certifications))
      .catch(() => {
        addToast({ title: t('toast.failedToLoad'), description: t('browse.loadError'), color: 'danger' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  function handleCertSelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const key = keys instanceof Set && keys.size > 0 ? String(Array.from(keys)[0]) : null;
    setOpenCertKey(key);
  }

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
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : certifications.length === 0 ? (
        <p className="text-default-400 text-sm">{t('browse.noQuestions')}</p>
      ) : (
        <Accordion
          selectionMode="single"
          onSelectionChange={handleCertSelectionChange}
          selectedKeys={openCertKey ? [openCertKey] : []}
          className="flex flex-col gap-3 p-0 shadow-none"
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl overflow-hidden',
            title: 'font-semibold text-foreground',
            trigger: 'px-4 py-3 hover:bg-default-100 transition-colors duration-200',
            content: 'px-3 pb-3',
            indicator: 'text-default-400',
          }}
        >
          {certifications.map((cert) => (
            <AccordionItem
              key={cert.key}
              title={
                <div className="flex items-center gap-3">
                  <span>{cert.label}</span>
                  <span className="bg-secondary-100 text-secondary-700 text-xs font-semibold rounded-full px-2 py-0.5">
                    {cert.totalCount}
                  </span>
                </div>
              }
            >
              <CertificationAccordion
                certification={cert}
                isOpen={openCertKey === cert.key}
              />
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </PageHeader>
  );
}
