'use client';

import { useState, useCallback } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { addToast } from '@heroui/toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

import { EditPublicExamModal } from './EditPublicExamModal';

import { PublicExamSubjectsTable } from '@/shared/components/PublicExamSubjectsTable';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { deletePublicExam } from '@/features/connectors';
import { PublicExam, PublicExamSubject, PublicExamTopic, ExamBoard } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface PublicExamsListTabProps {
  readonly onCreateNew: () => void;
}

export function PublicExamsListTab({ onCreateNew }: PublicExamsListTabProps) {
  const { t } = useTranslation();
  const { publicExams, updatePublicExam, removePublicExam } = usePublicExamsContext();
  const [editingExam, setEditingExam] = useState<PublicExam | null>(null);
  const [deletingExam, setDeletingExam] = useState<PublicExam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubjectUpdated = useCallback(
    (publicExam: PublicExam, subjectId: string, newName: string, minQuestions: number, maxQuestions: number) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId ? { ...s, name: newName, minQuestions, maxQuestions } : s
      );

      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam]
  );

  const handleSubjectRemoved = useCallback(
    (publicExam: PublicExam, subjectId: string) => {
      const updatedSubjects = publicExam.subjects.filter((s) => s.id !== subjectId);

      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam]
  );

  const handleSubjectAdded = useCallback(
    (publicExam: PublicExam, subject: PublicExamSubject) => {
      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: [...publicExam.subjects, subject] });
    },
    [updatePublicExam]
  );

  const handleTopicAdded = useCallback(
    (publicExam: PublicExam, subjectId: string, topic: PublicExamTopic) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId ? { ...s, topics: [...(s.topics ?? []), topic] } : s
      );

      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam]
  );

  const handleTopicRemoved = useCallback(
    (publicExam: PublicExam, subjectId: string, topicId: string) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId ? { ...s, topics: (s.topics ?? []).filter((tp) => tp.id !== topicId) } : s
      );

      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam]
  );

  const handleTopicUpdated = useCallback(
    (publicExam: PublicExam, subjectId: string, topicId: string, newName: string) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId
          ? { ...s, topics: (s.topics ?? []).map((tp) => (tp.id === topicId ? { ...tp, name: newName } : tp)) }
          : s
      );

      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam]
  );

  const handleExamSaved = useCallback(
    (id: string, updated: { name: string; role?: string; year?: number; examBoard: ExamBoard }) => {
      updatePublicExam(id, {
        name: updated.name,
        role: updated.role,
        year: updated.year,
        examBoard: updated.examBoard,
      });
    },
    [updatePublicExam]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingExam?.id) return;
    setIsDeleting(true);
    try {
      await deletePublicExam(deletingExam.id);
      removePublicExam(deletingExam.id);
      addToast({
        title: t('toast.success'),
        description: t('concurso.examDeleted', { name: deletingExam.name }),
        color: 'success',
      });
      setDeletingExam(null);
    } catch {
      addToast({ title: t('toast.error'), description: t('concurso.examDeleteError'), color: 'danger' });
    } finally {
      setIsDeleting(false);
    }
  }, [deletingExam, removePublicExam, t]);

  return (
    <>
      {publicExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 bg-content1 border border-default-200 rounded-xl text-center">
          <p className="text-base font-semibold text-foreground">{t('concurso.noExamsTitle')}</p>
          <p className="text-sm text-default-500 max-w-sm">{t('concurso.noExamsDescription')}</p>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 mt-2"
            startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faPlus} />}
            onPress={onCreateNew}
          >
            {t('concurso.tabNew')}
          </Button>
        </div>
      ) : (
        <Accordion
        className="mt-2 flex flex-col gap-2 px-0"
        itemClasses={{
          base: 'bg-content1 border border-default-200 rounded-xl',
          title: 'text-sm text-foreground font-semibold',
          titleWrapper: 'flex-1 flex flex-col text-start min-w-0 overflow-hidden',
          trigger: 'px-4 py-3 hover:bg-default-100 rounded-xl transition-colors duration-200',
          content: 'px-4 pb-4',
          indicator: 'text-default-400',
        }}
      >
        {publicExams.map((publicExam) => (
          <AccordionItem
            key={publicExam.id ?? publicExam.name}
            aria-label={publicExam.name}
            title={
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">{publicExam.name}</span>
                <span className="text-xs text-default-400 shrink-0">·</span>
                <span className="text-xs text-default-500 shrink-0">{publicExam.examBoard?.name}</span>
                {publicExam.role && (
                  <>
                    <span className="text-xs text-default-400 shrink-0">·</span>
                    <span className="text-xs text-default-500 shrink-0">{publicExam.role}</span>
                  </>
                )}
                {publicExam.year != null && (
                  <>
                    <span className="text-xs text-default-400 shrink-0">·</span>
                    <span className="text-xs text-default-500 shrink-0">{publicExam.year}</span>
                  </>
                )}
                <span
                  aria-label={t('common.remove')}
                  className="ml-auto shrink-0 p-1.5 rounded-lg text-default-400 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingExam(publicExam);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      setDeletingExam(publicExam);
                    }
                  }}
                >
                  <FontAwesomeIcon className="w-3 h-3" icon={faTrash} />
                </span>
              </div>
            }
          >
            <PublicExamSubjectsTable
              selectedPublicExam={publicExam}
              subjectsList={publicExam.subjects}
              onEditPublicExam={() => setEditingExam(publicExam)}
              onSubjectAdded={(subject) => handleSubjectAdded(publicExam, subject)}
              onSubjectRemoved={(subjectId) => handleSubjectRemoved(publicExam, subjectId)}
              onSubjectUpdated={(subjectId, newName, min, max) =>
                handleSubjectUpdated(publicExam, subjectId, newName, min, max)
              }
              onTopicAdded={(subjectId, topic) => handleTopicAdded(publicExam, subjectId, topic)}
              onTopicRemoved={(subjectId, topicId) => handleTopicRemoved(publicExam, subjectId, topicId)}
              onTopicUpdated={(subjectId, topicId, newName) =>
                handleTopicUpdated(publicExam, subjectId, topicId, newName)
              }
            />
          </AccordionItem>
        ))}
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
              className="border border-default-200 text-default-600"
              isDisabled={isDeleting}
              variant="flat"
              onPress={() => setDeletingExam(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button color="danger" isLoading={isDeleting} onPress={handleDeleteConfirm}>
              {t('common.remove')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
