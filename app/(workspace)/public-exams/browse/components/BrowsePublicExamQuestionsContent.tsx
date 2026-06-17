'use client';
import { useEffect, useState } from 'react';
import type { Selection } from '@react-types/shared';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Skeleton } from '@heroui/skeleton';
import { addToast } from '@heroui/toast';
import { BrowsePublicExamSummary } from '@/shared/types';
import { getPublicExamBrowseSummary } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PublicExamAccordion } from './PublicExamAccordion';

export function BrowsePublicExamQuestionsContent() {
  const { t } = useTranslation();
  const [publicExams, setPublicExams] = useState<BrowsePublicExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openExamId, setOpenExamId] = useState<string | null>(null);

  useEffect(() => {
    getPublicExamBrowseSummary()
      .then((data) => setPublicExams(data.publicExams))
      .catch(() => {
        addToast({ title: t('toast.failedToLoad'), description: t('browse.loadError'), color: 'danger' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  function handleSelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const key = keys instanceof Set && keys.size > 0 ? String(Array.from(keys)[0]) : null;
    setOpenExamId(key);
  }

  const totalQuestions = publicExams.reduce((sum, e) => sum + e.totalCount, 0);

  return (
    <PageHeader
      title={t('concurso.browseTitle')}
      subtitle={
        isLoading
          ? ''
          : t('concurso.browseSubtitle', { total: totalQuestions, count: publicExams.length })
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : publicExams.length === 0 ? (
        <p className="text-default-400 text-sm">{t('concurso.browseNoQuestions')}</p>
      ) : (
        <Accordion
          selectionMode="single"
          onSelectionChange={handleSelectionChange}
          selectedKeys={openExamId ? [openExamId] : []}
          className="flex flex-col gap-3 p-0 shadow-none"
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl overflow-hidden',
            title: 'font-semibold text-foreground',
            trigger: 'px-4 py-3 hover:bg-default-100 transition-colors duration-200',
            content: 'px-3 pb-3',
            indicator: 'text-default-400',
          }}
        >
          {publicExams.map((exam) => (
            <AccordionItem
              key={exam.id}
              title={
                <div className="flex items-center gap-3">
                  <span>{exam.name}</span>
                  <span className="text-xs text-default-500">{exam.examBoardName}</span>
                  <span className="bg-secondary-100 text-secondary-700 text-xs font-semibold rounded-full px-2 py-0.5">
                    {exam.totalCount}
                  </span>
                </div>
              }
            >
              <PublicExamAccordion publicExam={exam} isOpen={openExamId === exam.id} />
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </PageHeader>
  );
}
