'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { ExamCard } from './ExamCard';
import { ExamDetailPanel } from './ExamDetailPanel';

import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { EntityListShell } from '@/shared/components/ui/EntityListShell';
import { usePaginatedItems } from '@/features/hooks/usePaginatedItems.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import type { Exam, ExamType } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { CatalogDiscoveryCard } from '../catalog/CatalogDiscoveryCard';

interface ExamsListProps {
  readonly type: ExamType;
}

export function ExamsList({ type }: ExamsListProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const { certifications, publicExams, isLoading, removeExam } = useExamsContext();
  const exams = type === 'certification' ? certifications : publicExams;
  const hasExams = !isLoading && exams.length > 0;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const detailRef = useRef<HTMLDivElement>(null);
  const { pageItems, page, totalPages, perPage, setPage, setPerPage } = usePaginatedItems(exams);
  const selectedExam = exams.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedExam) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedExam]);

  const handleCardClick = useCallback((exam: Exam) => {
    setSelectedId((prev) => (prev === exam.id ? null : (exam.id ?? null)));
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingExam?.id) return;
    setIsDeleting(true);
    try {
      await deleteExam(deletingExam.id);
      removeExam(deletingExam.id);
      if (selectedId === deletingExam.id) setSelectedId(null);
      notify.success(t('toast.success'), t(config.deleteSuccessKey, { name: deletingExam.name }));
      setDeletingExam(null);
    } catch {
      notify.error(t('toast.error'), t(config.deleteErrorKey));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingExam, removeExam, selectedId, config, t]);

  return (
    <>
      <EntityListShell
        totalItems={exams.length}
        isLoading={isLoading}
        emptyState={
          <IllustratedEmptyState
            icon={config.icon}
            title={t(config.emptyTitle)}
            description={t(config.emptyDescription)}
            action={{ label: t(config.emptyActionLabel), href: `/exams/new?type=${type}` }}
            secondaryAction={{ label: t('catalog.browseAction'), href: `/exams/catalog?type=${type}` }}
          />
        }
        paginationLabel={type === 'certification' ? t('nav.certifications') : t('nav.publicExams')}
        pagination={
          totalPages > 1
            ? {
                currentPage: page,
                totalPages,
                totalItems: exams.length,
                itemsPerPage: perPage,
                onPageChange: setPage,
                onItemsPerPageChange: (e) => setPerPage(Number(e.target.value)),
              }
            : undefined
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4">
          {pageItems.map((exam) => (
            <ExamCard
              key={exam.id ?? exam.name}
              exam={exam}
              isSelected={selectedId === exam.id}
              type={type}
              onClick={() => handleCardClick(exam)}
            />
          ))}
          {hasExams && <CatalogDiscoveryCard type={type} />}
        </div>

        <AnimatePresence>
          {selectedExam && (
            <motion.div
              key={selectedExam.id}
              ref={detailRef}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6"
            >
              <SectionHeader
                className="mb-4"
                icon={faPenToSquare}
                subtitle={t('exam.detailsSectionSubtitle')}
                title={t('exam.detailsSectionLabel')}
              />
              <ExamDetailPanel
                exam={selectedExam}
                type={type}
                onClose={() => setSelectedId(null)}
                onDelete={() => setDeletingExam(selectedExam)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </EntityListShell>

      <ConfirmModal
        body={
          <p className="text-sm text-default-500">{t(config.deleteConfirmKey, { name: deletingExam?.name ?? '' })}</p>
        }
        confirmLabel={t('common.remove')}
        isLoading={isDeleting}
        isOpen={deletingExam !== null}
        title={t(config.deleteTitle)}
        onClose={() => setDeletingExam(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
