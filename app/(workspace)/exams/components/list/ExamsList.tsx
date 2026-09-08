'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';

import { ExamCard } from './ExamCard';
import { ExamsListToolbar } from './ExamsListToolbar';
import { filterAndSortExams, type ExamListSort, type ExamListTab } from './examsListFilters';

import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { CatalogDiscoveryCard } from '@/app/(workspace)/exams/components/catalog/CatalogDiscoveryCard';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { EntityListShell } from '@/shared/components/ui/EntityListShell';
import { usePaginatedItems } from '@/features/hooks/usePaginatedItems.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import type { Exam } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { canEditExams } from '@/config/constants';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';

interface ExamsListProps {
  readonly onCreateNew: () => void;
}

export function ExamsList({ onCreateNew }: ExamsListProps) {
  const { t } = useTranslation();
  const { exams, isLoading, removeExam } = useExamsContext();
  const { data: session } = useSession();
  const canEdit = !session?.user?.plan || canEditExams(session.user.plan);

  const [tab, setTab] = useState<ExamListTab>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ExamListSort>('activity');
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const filtered = useMemo(() => filterAndSortExams(exams, { tab, search, sort }), [exams, tab, search, sort]);
  const hasActiveFilters = tab !== 'all' || search.trim() !== '';

  const { pageItems, page, totalPages, perPage, setPage, setPerPage } = usePaginatedItems(filtered);

  const handleClearFilters = useCallback(() => {
    setTab('all');
    setSearch('');
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingExam?.id) return;
    const config = EXAM_CONFIG[deletingExam.type];
    setIsDeleting(true);
    try {
      await deleteExam(deletingExam.id);
      removeExam(deletingExam.id);
      notify.success(t('toast.success'), t(config.deleteSuccessKey, { name: deletingExam.name }));
      setDeletingExam(null);
    } catch {
      notify.error(t('toast.error'), t(config.deleteErrorKey));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingExam, removeExam, t]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <ExamsListToolbar
          exams={exams}
          search={search}
          sort={sort}
          tab={tab}
          onSearchChange={setSearch}
          onSortChange={setSort}
          onTabChange={setTab}
        />

        <EntityListShell
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
          paginationLabel={t('nav.myExams')}
          totalItems={filtered.length}
          emptyState={
            <IllustratedEmptyState
              action={{ label: t('exam.createButtonLabel'), onPress: onCreateNew }}
              description={t('exam.listEmptyDescription')}
              icon={faGraduationCap}
              title={t('exam.listEmptyTitle')}
            />
          }
          pagination={
            totalPages > 1
              ? {
                  currentPage: page,
                  totalPages,
                  totalItems: filtered.length,
                  itemsPerPage: perPage,
                  onPageChange: setPage,
                  onItemsPerPageChange: (e) => setPerPage(Number(e.target.value)),
                }
              : undefined
          }
          onClearFilters={handleClearFilters}
        >
          <div className="flex flex-col gap-3">
            {pageItems.map((exam) => (
              <ExamCard
                key={exam.id ?? exam.name}
                canEdit={canEdit}
                exam={exam}
                onDelete={() => setDeletingExam(exam)}
                onUpgradeRequired={() => setIsUpgradeOpen(true)}
              />
            ))}
            {tab !== 'draft' && filtered.length > 0 && (
              <CatalogDiscoveryCard type={tab === 'public_exam' ? 'public_exam' : 'certification'} />
            )}
          </div>
        </EntityListShell>
      </div>

      <ConfirmModal
        body={
          <p className="text-sm text-default-500">
            {t(EXAM_CONFIG[deletingExam?.type ?? 'certification'].deleteConfirmKey, {
              name: deletingExam?.name ?? '',
            })}
          </p>
        }
        confirmLabel={t('common.remove')}
        isLoading={isDeleting}
        isOpen={deletingExam !== null}
        title={t(EXAM_CONFIG[deletingExam?.type ?? 'certification'].deleteTitle)}
        onClose={() => setDeletingExam(null)}
        onConfirm={handleDeleteConfirm}
      />

      <UpgradeModal isOpen={isUpgradeOpen} product="pro" onClose={() => setIsUpgradeOpen(false)} />
    </>
  );
}
