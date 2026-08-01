'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ExamCard } from './ExamCard';
import { ExamDetailPanel } from './ExamDetailPanel';

import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { EditExamModal } from '@/shared/components/EditExamModal/EditExamModal';
import type {
  EditExamModalCertResult,
  EditExamModalPublicExamResult,
} from '@/shared/components/EditExamModal/EditExamModal';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import type { Exam, ExamSection, ExamTopic, ExamType } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface ExamsListProps {
  readonly type: ExamType;
}

export function ExamsList({ type }: ExamsListProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const { certifications, publicExams, isLoading, updateExam, removeExam } = useExamsContext();
  const exams = type === 'certification' ? certifications : publicExams;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedExam = exams.find((e) => e.id === selectedId) ?? null;

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
          provider: result.provider,
          totalQuestions: result.totalQuestions,
          examDurationMinutes: result.examDurationMinutes,
          passingScore: result.passingScore,
        });
      } else {
        const result = updated as EditExamModalPublicExamResult;
        updateExam(id, {
          name: result.name,
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

  if (isLoading) return <SkeletonListLoader />;

  if (exams.length === 0) {
    return (
      <EmptyState
        action={{ label: t(config.emptyActionLabel), href: '?new=true' }}
        description={t(config.emptyDescription)}
        title={t(config.emptyTitle)}
      />
    );
  }

  return (
    <>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon className="text-xs text-primary" icon={config.icon} />
        </div>
        <h2 className="text-sm font-bold text-foreground">{t(config.listTitle)}</h2>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-content2 border border-default-200 text-xs font-medium text-default-500">
          {exams.length}
        </span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {exams.map((exam) => (
          <ExamCard
            key={exam.id ?? exam.name}
            exam={exam}
            isSelected={selectedId === exam.id}
            type={type}
            onClick={() => handleCardClick(exam)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedExam && (
          <motion.div
            key={selectedExam.id}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
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

      <EditExamModal
        exam={editingExam}
        isOpen={editingExam !== null}
        onClose={() => setEditingExam(null)}
        onSaved={handleExamSaved}
      />

      <ConfirmModal
        body={
          <p className="text-sm text-default-500">
            {t(config.deleteConfirmKey, { name: deletingExam?.name ?? '' })}
          </p>
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
