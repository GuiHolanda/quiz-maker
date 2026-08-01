'use client';

import { useState, useCallback, useRef } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import {
  faBullseye,
  faClock,
  faHashtag,
  faLayerGroup,
  faPen,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditExamModal } from '@/shared/components/EditExamModal/EditExamModal';
import type { EditExamModalCertResult } from '@/shared/components/EditExamModal/EditExamModal';
import { ExamSectionsTable, ExamSectionsTableHandle } from '@/shared/components/ExamSectionsTable/ExamSectionsTable';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import { Exam, ExamSection, ExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

export function CertificationsListTab() {
  const { t } = useTranslation();
  const { certifications, isLoading, updateExam, removeExam } = useExamsContext();
  const [editingCert, setEditingCert] = useState<Exam | null>(null);
  const [deletingCert, setDeletingCert] = useState<Exam | null>(null);
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

  const handleCertSaved = useCallback(
    (id: string, updated: EditExamModalCertResult) => {
      updateExam(id, {
        name: updated.name,
        provider: updated.provider,
        totalQuestions: updated.totalQuestions,
        examDurationMinutes: updated.examDurationMinutes,
        passingScore: updated.passingScore,
      });
    },
    [updateExam]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCert?.id) return;
    setIsDeleting(true);
    try {
      await deleteExam(deletingCert.id);
      removeExam(deletingCert.id);
      notify.success(t('toast.success'), t('certification.certificationDeleted', { name: deletingCert.name }));
      setDeletingCert(null);
    } catch {
      notify.error(t('toast.error'), t('certification.certificationDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingCert, removeExam, t]);

  if (isLoading) {
    return <SkeletonListLoader />;
  }

  return (
    <>
      {certifications.length === 0 ? (
        <EmptyState
          action={{
            label: t('certification.tabNew'),
            href: '?new=true',
          }}
          description={t('certification.noCertificationsDescription')}
          title={t('certification.noCertificationsTitle')}
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
          {certifications.map((certification) => {
            const examKey = certification.id ?? certification.name;

            return (
              <AccordionItem key={examKey} aria-label={certification.name} title={renderTriggerTitle(certification)}>
                <ExamSectionsTable
                  ref={(el) => {
                    tableRefs.current[examKey] = el;
                  }}
                  selectedExam={certification}
                  sectionsList={certification.sections}
                  onSectionAdded={(section) => handleSectionAdded(certification, section)}
                  onSectionRemoved={(sectionId) => handleSectionRemoved(certification, sectionId)}
                  onSectionUpdated={(sectionId, newName, min, max) =>
                    handleSectionUpdated(certification, sectionId, newName, min, max)
                  }
                  onTopicAdded={(sectionId, topic) => handleTopicAdded(certification, sectionId, topic)}
                  onTopicRemoved={(sectionId, topicId) => handleTopicRemoved(certification, sectionId, topicId)}
                  onTopicUpdated={(sectionId, topicId, newName) =>
                    handleTopicUpdated(certification, sectionId, topicId, newName)
                  }
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-default-200">
                  <Button
                    className={buttonStyles.primarySm}
                    size="sm"
                    startContent={<FontAwesomeIcon className="text-[10px]" icon={faPlus} />}
                    onPress={() => tableRefs.current[examKey]?.startAdd()}
                  >
                    {t('certification.addTopic')}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      className={buttonStyles.flat}
                      size="sm"
                      startContent={<FontAwesomeIcon className="text-xs" icon={faPen} />}
                      onPress={() => setEditingCert(certification)}
                    >
                      {t('certification.editCertification')}
                    </Button>
                    <Button
                      className={buttonStyles.dangerFlat}
                      size="sm"
                      startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
                      onPress={() => setDeletingCert(certification)}
                    >
                      {t('certification.deleteCertificationTitle')}
                    </Button>
                  </div>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <EditExamModal
        exam={editingCert}
        isOpen={editingCert !== null}
        onClose={() => setEditingCert(null)}
        onSaved={handleCertSaved}
      />

      <ConfirmModal
        body={
          <p className="text-sm text-default-500">
            {t('certification.deleteCertificationConfirm', { name: deletingCert?.name ?? '' })}
          </p>
        }
        confirmLabel={t('common.remove')}
        isLoading={isDeleting}
        isOpen={deletingCert !== null}
        title={t('certification.deleteCertificationTitle')}
        onClose={() => setDeletingCert(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );

  function renderTriggerTitle(certification: Exam) {
    const topicStatus =
      certification.sections.length === 0 ? (
        <Chip color="warning" size="sm" variant="flat">
          {t('certification.noTopics')}
        </Chip>
      ) : (
        <span
          aria-label={t('certification.topicsAriaLabel', { count: String(certification.sections.length) })}
          className="flex items-center gap-1 text-xs text-default-400"
        >
          <FontAwesomeIcon className="text-[10px]" icon={faLayerGroup} />
          {certification.sections.length === 1
            ? t('certification.topicCount1')
            : t('certification.topicCountN', { count: String(certification.sections.length) })}
        </span>
      );

    const isEdited =
      certification.createdAt && certification.updatedAt ? certification.updatedAt !== certification.createdAt : false;

    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate min-w-0">{certification.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            {certification.provider?.name && (
              <span className="text-xs text-default-400 truncate max-w-[160px]">{certification.provider.name}</span>
            )}
            {topicStatus}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {certification.totalQuestions > 0 && (
              <span
                aria-label={t('certification.totalQuestionsAriaLabel', {
                  count: String(certification.totalQuestions),
                })}
                className="flex items-center gap-1 text-xs text-default-400"
              >
                <FontAwesomeIcon className="text-[10px]" icon={faHashtag} />
                {t('certification.questionsCount', { count: String(certification.totalQuestions) })}
              </span>
            )}
            {certification.examDurationMinutes && (
              <span
                aria-label={t('certification.durationAriaLabel', {
                  minutes: String(certification.examDurationMinutes),
                })}
                className="flex items-center gap-1 text-xs text-default-400"
              >
                <FontAwesomeIcon className="text-[10px]" icon={faClock} />
                {t('certification.durationValue', { minutes: String(certification.examDurationMinutes) })}
              </span>
            )}
            {certification.passingScore != null && (
              <span
                aria-label={t('certification.passingScoreAriaLabel', { score: String(certification.passingScore) })}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                <FontAwesomeIcon className="text-[10px]" icon={faBullseye} />
                {t('certification.passingScoreValue', { score: String(certification.passingScore) })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-default-400 shrink-0">
            {certification.createdAt && (
              <span>
                {t('common.createdAt', { date: '' }).replace('{date}', '')}
                <RelativeDate date={certification.createdAt} />
              </span>
            )}
            {isEdited && certification.updatedAt && (
              <span>
                {t('common.updatedAt', { date: '' }).replace('{date}', '')}
                <RelativeDate date={certification.updatedAt} />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}
