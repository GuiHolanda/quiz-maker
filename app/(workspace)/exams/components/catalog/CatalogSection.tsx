'use client';

import { useEffect, useState } from 'react';

import { ExamCard } from '../list/ExamCard';

import { getCatalogExams, forkCatalogExam } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { EntityListShell } from '@/shared/components/ui/EntityListShell';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { usePaginatedItems } from '@/features/hooks/usePaginatedItems.hook';
import { notify } from '@/shared/lib/notify';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import type { CatalogExam, ExamType } from '@/shared/types';

interface CatalogSectionProps {
  readonly type: ExamType;
}

export function CatalogSection({ type }: CatalogSectionProps) {
  const { t } = useTranslation();
  const { addExam } = useExamsContext();
  const [templates, setTemplates] = useState<CatalogExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingExam, setConfirmingExam] = useState<CatalogExam | null>(null);
  const [isForking, setIsForking] = useState(false);

  const { pageItems, page, totalPages, perPage, setPage, setPerPage } = usePaginatedItems(templates);

  useEffect(() => {
    getCatalogExams()
      .then((all) => setTemplates(all.filter((t) => t.type === type)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [type]);

  async function handleFork() {
    if (!confirmingExam) return;
    setIsForking(true);
    try {
      const forked = await forkCatalogExam(confirmingExam.id);
      addExam(forked);
      setTemplates((prev) => prev.filter((t) => t.id !== confirmingExam.id));
      setConfirmingExam(null);
      notify.success(t('catalog.forkSuccessTitle'), t('catalog.forkSuccessDescription'));
    } catch {
      notify.error(t('catalog.forkErrorTitle'));
    } finally {
      setIsForking(false);
    }
  }

  return (
    <>
      <EntityListShell
        totalItems={isLoading ? undefined : templates.length}
        isLoading={isLoading}
        skeleton={<SkeletonListLoader count={3} height="h-36" />}
        emptyState={
          <IllustratedEmptyState
            icon={faLayerGroup}
            title={t('catalog.noTemplates')}
            description={t('catalog.noTemplatesDescription')}
          />
        }
        paginationLabel={t('common.templates')}
        pagination={
          totalPages > 1
            ? {
                currentPage: page,
                totalPages,
                totalItems: templates.length,
                itemsPerPage: perPage,
                onPageChange: setPage,
                onItemsPerPageChange: (e) => setPerPage(Number(e.target.value)),
              }
            : undefined
        }
      >
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(760px, 100%), 760px))' }}
        >
          {pageItems.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              isSelected={false}
              type={exam.type}
              onClick={() => setConfirmingExam(exam)}
            />
          ))}
        </div>
      </EntityListShell>

      <ConfirmModal
        confirmLabel={t('catalog.useTemplate')}
        confirmVariant="primary"
        isLoading={isForking}
        isOpen={confirmingExam !== null}
        title={t('catalog.confirmForkTitle')}
        body={
          <p className="text-sm text-default-500">
            {t('catalog.confirmForkBody', { name: confirmingExam?.name ?? '' })}
          </p>
        }
        onClose={() => !isForking && setConfirmingExam(null)}
        onConfirm={handleFork}
      />
    </>
  );
}
