'use client';

import { useState, useCallback, useRef } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditPublicExamModal } from './EditPublicExamModal';

import { buttonStyles } from '@/config/constants/buttonStyles';
import { PublicExamSubjectsTable, PublicExamSubjectsTableHandle } from '@/shared/components/PublicExamSubjectsTable';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { deletePublicExam } from '@/features/connectors';
import { PublicExam, PublicExamSubject, PublicExamTopic, ExamBoard } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

interface PublicExamsListTabProps {
  readonly onCreateNew: () => void;
}

export function PublicExamsListTab({ onCreateNew }: PublicExamsListTabProps) {
  const { t } = useTranslation();
  const { publicExams, isLoading, updatePublicExam, removePublicExam } = usePublicExamsContext();
  const [editingExam, setEditingExam] = useState<PublicExam | null>(null);
  const [deletingExam, setDeletingExam] = useState<PublicExam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tableRefs = useRef<Record<string, PublicExamSubjectsTableHandle | null>>({});

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
    (id: string, updated: { name: string; role?: string; year?: number; examBoard: ExamBoard; totalQuestions: number; examDurationMinutes?: number; passingScore?: number }) => {
      updatePublicExam(id, {
        name: updated.name,
        role: updated.role,
        year: updated.year,
        examBoard: updated.examBoard,
        totalQuestions: updated.totalQuestions,
        examDurationMinutes: updated.examDurationMinutes,
        passingScore: updated.passingScore,
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
      notify.success(t('toast.success'), t('concurso.examDeleted', { name: deletingExam.name }));
      setDeletingExam(null);
    } catch {
      notify.error(t('toast.error'), t('concurso.examDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingExam, removePublicExam, t]);

  return (
    <>
      {isLoading ? (
        <SkeletonListLoader />
      ) : publicExams.length === 0 ? (
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
            trigger: 'px-6 py-4 hover:bg-content2 rounded-xl transition-colors duration-200',
            content: 'px-6 pb-6',
            indicator: 'text-default-400',
          }}
          showDivider={false}
        >
          {publicExams.map((publicExam) => {
            const examKey = publicExam.id ?? publicExam.name;

            return (
              <AccordionItem
                key={examKey}
                aria-label={publicExam.name}
                title={
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
                      {publicExam.name}
                    </span>
                    {publicExam.examBoard?.name && (
                      <span className="text-xs text-default-500 shrink-0 max-w-[120px] truncate">
                        {publicExam.examBoard.name}
                      </span>
                    )}
                    {publicExam.year != null && (
                      <span className="text-xs font-mono text-default-400 shrink-0">{publicExam.year}</span>
                    )}
                    {publicExam.totalQuestions > 0 && (
                      <span className="text-xs font-mono text-default-400 shrink-0">
                        {publicExam.totalQuestions}Q
                      </span>
                    )}
                    {publicExam.examDurationMinutes && (
                      <span className="text-xs font-mono text-default-400 shrink-0">
                        {publicExam.examDurationMinutes}min
                      </span>
                    )}
                    {publicExam.passingScore != null && (
                      <span className="text-xs font-mono text-default-400 shrink-0">
                        {publicExam.passingScore}%
                      </span>
                    )}
                    {publicExam.subjects.length === 0 ? (
                      <Chip color="warning" size="sm" variant="flat">
                        {t('concurso.noSubjects')}
                      </Chip>
                    ) : (
                      <span className="text-xs font-mono text-default-400 shrink-0">
                        {publicExam.subjects.length === 1
                          ? t('concurso.subjectCount1')
                          : t('concurso.subjectCountN', { count: String(publicExam.subjects.length) })}
                      </span>
                    )}
                  </div>
                }
              >
                <PublicExamSubjectsTable
                  ref={(el) => { tableRefs.current[examKey] = el; }}
                  selectedPublicExam={publicExam}
                  subjectsList={publicExam.subjects}
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-default-200">
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
}
