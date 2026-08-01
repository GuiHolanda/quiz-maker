'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import {
  faBullseye,
  faCalendar,
  faClock,
  faHashtag,
  faLayerGroup,
  faPen,
  faPlus,
  faTrash,
  faXmark,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditExamModal } from '@/shared/components/EditExamModal/EditExamModal';
import type {
  EditExamModalCertResult,
  EditExamModalPublicExamResult,
} from '@/shared/components/EditExamModal/EditExamModal';

import { buttonStyles } from '@/config/constants/buttonStyles';
import { ExamSectionsTable, ExamSectionsTableHandle } from '@/shared/components/ExamSectionsTable/ExamSectionsTable';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import { Exam, ExamSection, ExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';

export function PublicExamsListTab() {
  const { t } = useTranslation();
  const { publicExams, isLoading, updateExam, removeExam } = useExamsContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tableRef = useRef<ExamSectionsTableHandle | null>(null);

  const selectedExam = publicExams.find((e) => e.id === selectedId) ?? null;

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
      const updatedSections = exam.sections.filter((section) => section.id !== sectionId);
      updateExam(exam.id, { sections: updatedSections });
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
    },
    [updateExam]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingExam?.id) return;
    setIsDeleting(true);
    try {
      await deleteExam(deletingExam.id);
      removeExam(deletingExam.id);
      if (selectedId === deletingExam.id) setSelectedId(null);
      notify.success(t('toast.success'), t('concurso.examDeleted', { name: deletingExam.name }));
      setDeletingExam(null);
    } catch {
      notify.error(t('toast.error'), t('concurso.examDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingExam, removeExam, selectedId, t]);

  if (isLoading) {
    return <SkeletonListLoader />;
  }

  if (publicExams.length === 0) {
    return (
      <EmptyState
        action={{ label: t('concurso.tabNew'), href: '?new=true' }}
        description={t('concurso.noExamsDescription')}
        title={t('concurso.noExamsTitle')}
      />
    );
  }

  return (
    <>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon className="text-xs text-primary" icon={faClipboardList} />
        </div>
        <h2 className="text-sm font-bold text-foreground">{t('concurso.tabList')}</h2>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-content2 border border-default-200 text-xs font-medium text-default-500">
          {publicExams.length}
        </span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {publicExams.map((exam) => renderCard(exam))}
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
            {renderDetailPanel(selectedExam)}
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
            {t('concurso.deleteExamConfirm', { name: deletingExam?.name ?? '' })}
          </p>
        }
        confirmLabel={t('common.remove')}
        isLoading={isDeleting}
        isOpen={deletingExam !== null}
        title={t('concurso.deleteExamTitle')}
        onClose={() => setDeletingExam(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );

  function renderCard(exam: Exam) {
    const isSelected = selectedId === exam.id;
    const hasNoSubjects = exam.sections.length === 0;
    const initials = exam.examBoard?.name
      ? exam.examBoard.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join('')
      : null;

    const hasStats = exam.totalQuestions > 0 || !!exam.examDurationMinutes || exam.passingScore != null;

    return (
      <button
        key={exam.id ?? exam.name}
        aria-expanded={isSelected}
        aria-label={exam.name}
        className={[
          'group text-left w-full bg-content1 border rounded-xl p-4 transition-all duration-150 hover:bg-content2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isSelected
            ? 'border-primary bg-content2 ring-1 ring-primary/20'
            : 'border-default-200 hover:border-default-300',
        ].join(' ')}
        type="button"
        onClick={() => handleCardClick(exam)}
      >
        <div className="flex items-start gap-3 mb-4">
          {renderExamBoardAvatar(exam, initials)}
          <div className="flex-1 min-w-0 pt-0.5">
            <span className="block text-sm font-semibold text-foreground leading-snug line-clamp-2">{exam.name}</span>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {exam.examBoard?.name && <span className="text-xs text-default-400 truncate">{exam.examBoard.name}</span>}
              {exam.year != null && (
                <span className="flex items-center gap-1 text-xs text-default-400">
                  <FontAwesomeIcon className="text-[9px]" icon={faCalendar} />
                  {exam.year}
                </span>
              )}
            </div>
          </div>
          {hasNoSubjects ? (
            <Chip className="shrink-0 mt-0.5" color="warning" size="sm" variant="flat">
              {t('concurso.noSubjects')}
            </Chip>
          ) : (
            <Chip className="shrink-0 mt-0.5" color="primary" size="sm" variant="flat">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon className="text-[9px]" icon={faLayerGroup} />
                {exam.sections.length}
              </span>
            </Chip>
          )}
        </div>

        {hasStats && (
          <div className="flex flex-wrap gap-2">
            {exam.totalQuestions > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-content2 border border-default-200 text-xs text-default-500 group-hover:border-default-300 transition-colors duration-150">
                <FontAwesomeIcon className="text-[9px] text-default-400" icon={faHashtag} />
                {t('concurso.questionsCount', { count: String(exam.totalQuestions) })}
              </span>
            )}
            {exam.examDurationMinutes && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-content2 border border-default-200 text-xs text-default-500 group-hover:border-default-300 transition-colors duration-150">
                <FontAwesomeIcon className="text-[9px] text-default-400" icon={faClock} />
                {t('concurso.durationValue', { minutes: String(exam.examDurationMinutes) })}
              </span>
            )}
            {exam.passingScore != null && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/8 border border-primary/20 text-xs text-primary font-medium transition-colors duration-150">
                <FontAwesomeIcon className="text-[9px]" icon={faBullseye} />
                {t('concurso.passingScoreValue', { score: String(exam.passingScore) })}
              </span>
            )}
          </div>
        )}

        {exam.createdAt && (
          <div className={`text-xs text-default-400 ${hasStats ? 'mt-3 pt-3 border-t border-default-200' : 'mt-1'}`}>
            <RelativeDate
              date={exam.updatedAt && exam.updatedAt !== exam.createdAt ? exam.updatedAt : exam.createdAt}
            />
          </div>
        )}
      </button>
    );
  }

  function renderExamBoardAvatar(exam: Exam, initials: string | null) {
    if (initials) {
      return (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary leading-none tracking-tight">{initials}</span>
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-content2 border border-default-200 flex items-center justify-center shrink-0">
        <FontAwesomeIcon className="text-sm text-default-400" icon={faClipboardList} />
      </div>
    );
  }

  function renderDetailPanel(exam: Exam) {
    return (
      <div className="mt-4 bg-content1 border border-primary/40 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-default-200 bg-content2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{exam.name}</span>
            {exam.examBoard?.name && <span className="text-xs text-default-400 shrink-0">{exam.examBoard.name}</span>}
            {exam.year != null && (
              <span className="flex items-center gap-1 text-xs text-default-400 shrink-0">
                <FontAwesomeIcon className="text-[9px]" icon={faCalendar} />
                {exam.year}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              className={buttonStyles.flat}
              size="sm"
              startContent={<FontAwesomeIcon className="text-xs" icon={faPen} />}
              onPress={() => setEditingExam(exam)}
            >
              {t('concurso.editPublicExam')}
            </Button>
            <Button
              className={buttonStyles.dangerFlat}
              size="sm"
              startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
              onPress={() => setDeletingExam(exam)}
            >
              {t('concurso.deleteExamTitle')}
            </Button>
            <Button
              isIconOnly
              aria-label={t('common.close')}
              className={buttonStyles.iconOnly.neutral}
              size="sm"
              variant="light"
              onPress={() => setSelectedId(null)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        </div>

        <div className="p-5">
          <ExamSectionsTable
            ref={tableRef}
            selectedExam={exam}
            sectionsList={exam.sections}
            showTopics
            onSectionAdded={(section) => handleSectionAdded(exam, section)}
            onSectionRemoved={(sectionId) => handleSectionRemoved(exam, sectionId)}
            onSectionUpdated={(sectionId, newName, min, max) =>
              handleSectionUpdated(exam, sectionId, newName, min, max)
            }
            onTopicAdded={(sectionId, topic) => handleTopicAdded(exam, sectionId, topic)}
            onTopicRemoved={(sectionId, topicId) => handleTopicRemoved(exam, sectionId, topicId)}
            onTopicUpdated={(sectionId, topicId, newName) => handleTopicUpdated(exam, sectionId, topicId, newName)}
          />

          <div className="mt-4 pt-3 border-t border-default-200 flex justify-start">
            <Button
              className={buttonStyles.primarySm}
              size="sm"
              startContent={<FontAwesomeIcon className="text-[10px]" icon={faPlus} />}
              onPress={() => tableRef.current?.startAdd()}
            >
              {t('concurso.addSubject')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
