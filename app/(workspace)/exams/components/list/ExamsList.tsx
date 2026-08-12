'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { ExamCard } from './ExamCard';
import { ExamDetailPanel } from './ExamDetailPanel';

import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { EditExamModal } from '@/shared/components/EditExamModal/EditExamModal';
import type {
  EditExamModalCertResult,
  EditExamModalPublicExamResult,
} from '@/shared/components/EditExamModal/EditExamModal';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { EntityListShell } from '@/shared/components/ui/EntityListShell';
import { usePaginatedItems } from '@/features/hooks/usePaginatedItems.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import type { Exam, ExamSection, ExamTopic, ExamType } from '@/shared/types';
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
  const { certifications, publicExams, isLoading, updateExam, removeExam } = useExamsContext();
  const exams = type === 'certification' ? certifications : publicExams;
  const hasExams = !isLoading && exams.length > 0;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
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

  const handleSectionUpdated = useCallback(
    (exam: Exam, sectionId: string, newName: string, minQuestions: number, maxQuestions: number) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId ? { ...section, name: newName, minQuestions, maxQuestions } : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleSectionRemoved = useCallback(
    (exam: Exam, sectionId: string) => {
      if (!exam.id) return;
      updateExam(exam.id, { sections: exam.sections.filter((s) => s.id !== sectionId) });
    },
    [updateExam]
  );

  const handleSectionAdded = useCallback(
    (exam: Exam, section: ExamSection) => {
      if (!exam.id) return;
      updateExam(exam.id, { sections: [...exam.sections, section] });
    },
    [updateExam]
  );

  const handleTopicAdded = useCallback(
    (exam: Exam, sectionId: string, topic: ExamTopic) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId ? { ...section, topics: [...(section.topics ?? []), topic] } : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleTopicRemoved = useCallback(
    (exam: Exam, sectionId: string, topicId: string) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId
          ? { ...section, topics: (section.topics ?? []).filter((topic) => topic.id !== topicId) }
          : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleTopicUpdated = useCallback(
    (exam: Exam, sectionId: string, topicId: string, newName: string) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: (section.topics ?? []).map((topic) =>
                topic.id === topicId ? { ...topic, name: newName } : topic
              ),
            }
          : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleExamSaved = useCallback(
    (id: string, updated: EditExamModalCertResult | EditExamModalPublicExamResult) => {
      if (type === 'certification') {
        const result = updated as EditExamModalCertResult;
        updateExam(id, {
          name: result.name,
          key: result.key,
          provider: result.provider,
          totalQuestions: result.totalQuestions,
          examDurationMinutes: result.examDurationMinutes,
          passingScore: result.passingScore,
        });
      } else {
        const result = updated as EditExamModalPublicExamResult;
        updateExam(id, {
          name: result.name,
          key: result.key,
          role: result.role,
          year: result.year,
          examBoard: result.examBoard,
          totalQuestions: result.totalQuestions,
          examDurationMinutes: result.examDurationMinutes,
          passingScore: result.passingScore,
        });
      }
    },
    [type, updateExam]
  );

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
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(760px, 100%), 760px))' }}
        >
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
              <SectionHeader className="mb-4" icon={faPenToSquare} title={t('exam.detailsSectionLabel')} />
              <ExamDetailPanel
                exam={selectedExam}
                type={type}
                onClose={() => setSelectedId(null)}
                onDelete={() => setDeletingExam(selectedExam)}
                onEdit={() => setEditingExam(selectedExam)}
                onSectionAdded={(section) => handleSectionAdded(selectedExam, section)}
                onSectionRemoved={(sectionId) => handleSectionRemoved(selectedExam, sectionId)}
                onSectionUpdated={(sectionId, newName, min, max) =>
                  handleSectionUpdated(selectedExam, sectionId, newName, min, max)
                }
                onTopicAdded={(sectionId, topic) => handleTopicAdded(selectedExam, sectionId, topic)}
                onTopicRemoved={(sectionId, topicId) => handleTopicRemoved(selectedExam, sectionId, topicId)}
                onTopicUpdated={(sectionId, topicId, newName) =>
                  handleTopicUpdated(selectedExam, sectionId, topicId, newName)
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </EntityListShell>

      <EditExamModal
        exam={editingExam}
        isOpen={editingExam !== null}
        onClose={() => setEditingExam(null)}
        onSaved={handleExamSaved}
      />

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
