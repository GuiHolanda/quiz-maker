'use client';

import { useState, useCallback, useRef } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import {
  faBullseye,
  faCalendar,
  faClock,
  faHashtag,
  faLayerGroup,
  faPen,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditPublicExamModal } from './EditPublicExamModal';

import { buttonStyles } from '@/config/constants/buttonStyles';
import { ExamSectionsTable, ExamSectionsTableHandle } from '@/shared/components/ExamSectionsTable/ExamSectionsTable';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import { Exam, ExamSection, ExamTopic, ExamBoard } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';

interface PublicExamsListTabProps {
  readonly onCreateNew: () => void;
}

export function PublicExamsListTab({ onCreateNew }: PublicExamsListTabProps) {
  const { t } = useTranslation();
  const { publicExams, isLoading, updateExam, removeExam } = useExamsContext();
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tableRefs = useRef<Record<string, ExamSectionsTableHandle | null>>({});

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
    (
      id: string,
      updated: {
        name: string;
        role?: string;
        year?: number;
        examBoard: ExamBoard;
        totalQuestions: number;
        examDurationMinutes?: number;
        passingScore?: number;
      }
    ) => {
      updateExam(id, {
        name: updated.name,
        role: updated.role,
        year: updated.year,
        examBoard: updated.examBoard,
        totalQuestions: updated.totalQuestions,
        examDurationMinutes: updated.examDurationMinutes,
        passingScore: updated.passingScore,
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
      notify.success(t('toast.success'), t('concurso.examDeleted', { name: deletingExam.name }));
      setDeletingExam(null);
    } catch {
      notify.error(t('toast.error'), t('concurso.examDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingExam, removeExam, t]);

  if (isLoading) {
    return <SkeletonListLoader />;
  }

  return (
    <>
      {publicExams.length === 0 ? (
        <EmptyState
          action={{
            label: t('concurso.tabNew'),
            onPress: onCreateNew,
          }}
          description={t('concurso.noExamsDescription')}
          title={t('concurso.noExamsTitle')}
        />
      ) : (
        <Accordion
          className="mt-2 flex flex-col gap-2 px-0"
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl',
            title: 'text-sm font-bold text-foreground',
            titleWrapper: 'flex-1 flex flex-col text-start min-w-0 overflow-hidden',
            trigger: 'px-5 py-3 hover:bg-content2 rounded-xl transition-colors duration-200',
            content: 'px-5 pb-4',
            indicator: 'text-default-400',
          }}
          showDivider={false}
        >
          {publicExams.map((publicExam) => {
            const examKey = publicExam.id ?? publicExam.name;

            return (
              <AccordionItem key={examKey} aria-label={publicExam.name} title={renderTriggerTitle(publicExam)}>
                <ExamSectionsTable
                  ref={(el) => {
                    tableRefs.current[examKey] = el;
                  }}
                  selectedExam={publicExam}
                  sectionsList={publicExam.sections}
                  showTopics
                  onSectionAdded={(section) => handleSectionAdded(publicExam, section)}
                  onSectionRemoved={(sectionId) => handleSectionRemoved(publicExam, sectionId)}
                  onSectionUpdated={(sectionId, newName, min, max) =>
                    handleSectionUpdated(publicExam, sectionId, newName, min, max)
                  }
                  onTopicAdded={(sectionId, topic) => handleTopicAdded(publicExam, sectionId, topic)}
                  onTopicRemoved={(sectionId, topicId) => handleTopicRemoved(publicExam, sectionId, topicId)}
                  onTopicUpdated={(sectionId, topicId, newName) =>
                    handleTopicUpdated(publicExam, sectionId, topicId, newName)
                  }
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-default-200">
                  <Button
                    className={buttonStyles.primarySm}
                    size="sm"
                    startContent={<FontAwesomeIcon className="text-[10px]" icon={faPlus} />}
                    onPress={() => tableRefs.current[examKey]?.startAdd()}
                  >
                    {t('concurso.addSubject')}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      className={buttonStyles.flat}
                      size="sm"
                      startContent={<FontAwesomeIcon className="text-xs" icon={faPen} />}
                      onPress={() => setEditingExam(publicExam)}
                    >
                      {t('concurso.editPublicExam')}
                    </Button>
                    <Button
                      className={buttonStyles.dangerFlat}
                      size="sm"
                      startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
                      onPress={() => setDeletingExam(publicExam)}
                    >
                      {t('concurso.deleteExamTitle')}
                    </Button>
                  </div>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <EditPublicExamModal
        isOpen={editingExam !== null}
        publicExam={editingExam}
        onClose={() => setEditingExam(null)}
        onSaved={handleExamSaved}
      />

      <Modal isOpen={deletingExam !== null} size="sm" onClose={() => !isDeleting && setDeletingExam(null)}>
        <ModalContent>
          <ModalHeader>{t('concurso.deleteExamTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              {t('concurso.deleteExamConfirm', { name: deletingExam?.name ?? '' })}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              className={buttonStyles.secondary}
              isDisabled={isDeleting}
              variant="bordered"
              onPress={() => setDeletingExam(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button className={buttonStyles.danger} isLoading={isDeleting} onPress={handleDeleteConfirm}>
              {t('common.remove')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );

  function renderTriggerTitle(publicExam: Exam) {
    const subjectStatus =
      publicExam.sections.length === 0 ? (
        <Chip color="warning" size="sm" variant="flat">
          {t('concurso.noSubjects')}
        </Chip>
      ) : (
        <span
          aria-label={t('concurso.subjectsAriaLabel', { count: String(publicExam.sections.length) })}
          className="flex items-center gap-1 text-xs text-default-400"
        >
          <FontAwesomeIcon className="text-[10px]" icon={faLayerGroup} />
          {publicExam.sections.length === 1
            ? t('concurso.subjectCount1')
            : t('concurso.subjectCountN', { count: String(publicExam.sections.length) })}
        </span>
      );

    const isEdited = publicExam.createdAt && publicExam.updatedAt
      ? publicExam.updatedAt !== publicExam.createdAt
      : false;

    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate min-w-0">{publicExam.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            {publicExam.year != null && (
              <span
                aria-label={t('concurso.yearAriaLabel', { year: String(publicExam.year) })}
                className="flex items-center gap-1 text-xs text-default-400"
              >
                <FontAwesomeIcon className="text-[10px]" icon={faCalendar} />
                {publicExam.year}
              </span>
            )}
            {publicExam.examBoard?.name && (
              <span className="text-xs text-default-400 truncate max-w-[160px]">{publicExam.examBoard.name}</span>
            )}
            {subjectStatus}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {publicExam.totalQuestions > 0 && (
              <span
                aria-label={t('concurso.totalQuestionsAriaLabel', { count: String(publicExam.totalQuestions) })}
                className="flex items-center gap-1 text-xs text-default-400"
              >
                <FontAwesomeIcon className="text-[10px]" icon={faHashtag} />
                {t('concurso.questionsCount', { count: String(publicExam.totalQuestions) })}
              </span>
            )}
            {publicExam.examDurationMinutes && (
              <span
                aria-label={t('concurso.durationAriaLabel', { minutes: String(publicExam.examDurationMinutes) })}
                className="flex items-center gap-1 text-xs text-default-400"
              >
                <FontAwesomeIcon className="text-[10px]" icon={faClock} />
                {t('concurso.durationValue', { minutes: String(publicExam.examDurationMinutes) })}
              </span>
            )}
            {publicExam.passingScore != null && (
              <span
                aria-label={t('concurso.passingScoreAriaLabel', { score: String(publicExam.passingScore) })}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                <FontAwesomeIcon className="text-[10px]" icon={faBullseye} />
                {t('concurso.passingScoreValue', { score: String(publicExam.passingScore) })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-default-400 shrink-0">
            {publicExam.createdAt && (
              <span>
                {t('common.createdAt', { date: '' }).replace('{date}', '')}
                <RelativeDate date={publicExam.createdAt} />
              </span>
            )}
            {isEdited && publicExam.updatedAt && (
              <span>
                {t('common.updatedAt', { date: '' }).replace('{date}', '')}
                <RelativeDate date={publicExam.updatedAt} />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}
