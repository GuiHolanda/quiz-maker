'use client';

import { useState, useCallback } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';

import { PublicExamSubjectsTable } from '@/shared/components/PublicExamSubjectsTable';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { PublicExam, PublicExamSubject, PublicExamTopic, ExamBoard } from '@/shared/types';
import { EditPublicExamModal } from './EditPublicExamModal';

export function PublicExamsListTab() {
  const { publicExams, updatePublicExam } = usePublicExamsContext();
  const [editingExam, setEditingExam] = useState<PublicExam | null>(null);

  const handleSubjectUpdated = useCallback(
    (publicExam: PublicExam, subjectId: string, newName: string, minQuestions: number, maxQuestions: number) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId ? { ...s, name: newName, minQuestions, maxQuestions } : s,
      );
      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam],
  );

  const handleSubjectRemoved = useCallback(
    (publicExam: PublicExam, subjectId: string) => {
      const updatedSubjects = publicExam.subjects.filter((s) => s.id !== subjectId);
      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam],
  );

  const handleSubjectAdded = useCallback(
    (publicExam: PublicExam, subject: PublicExamSubject) => {
      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: [...publicExam.subjects, subject] });
    },
    [updatePublicExam],
  );

  const handleTopicAdded = useCallback(
    (publicExam: PublicExam, subjectId: string, topic: PublicExamTopic) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId ? { ...s, topics: [...(s.topics ?? []), topic] } : s,
      );
      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam],
  );

  const handleTopicRemoved = useCallback(
    (publicExam: PublicExam, subjectId: string, topicId: string) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId ? { ...s, topics: (s.topics ?? []).filter((tp) => tp.id !== topicId) } : s,
      );
      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam],
  );

  const handleTopicUpdated = useCallback(
    (publicExam: PublicExam, subjectId: string, topicId: string, newName: string) => {
      const updatedSubjects = publicExam.subjects.map((s) =>
        s.id === subjectId
          ? { ...s, topics: (s.topics ?? []).map((tp) => (tp.id === topicId ? { ...tp, name: newName } : tp)) }
          : s,
      );
      if (publicExam.id) updatePublicExam(publicExam.id, { subjects: updatedSubjects });
    },
    [updatePublicExam],
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
    [updatePublicExam],
  );

  return (
    <>
      <Accordion
        className="mt-2 flex flex-col gap-2 px-0"
        itemClasses={{
          base: 'bg-content1 border border-default-200 rounded-xl',
          title: 'text-sm text-foreground font-semibold',
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{publicExam.name}</span>
                <span className="text-xs text-default-400">·</span>
                <span className="text-xs text-default-500">{publicExam.examBoard?.name}</span>
                {publicExam.role && (
                  <>
                    <span className="text-xs text-default-400">·</span>
                    <span className="text-xs text-default-500">{publicExam.role}</span>
                  </>
                )}
                {publicExam.year != null && (
                  <>
                    <span className="text-xs text-default-400">·</span>
                    <span className="text-xs text-default-500">{publicExam.year}</span>
                  </>
                )}
              </div>
            }
          >
            <PublicExamSubjectsTable
              selectedPublicExam={publicExam}
              subjectsList={publicExam.subjects}
              onSubjectUpdated={(subjectId, newName, min, max) =>
                handleSubjectUpdated(publicExam, subjectId, newName, min, max)
              }
              onSubjectRemoved={(subjectId) => handleSubjectRemoved(publicExam, subjectId)}
              onSubjectAdded={(subject) => handleSubjectAdded(publicExam, subject)}
              onTopicAdded={(subjectId, topic) => handleTopicAdded(publicExam, subjectId, topic)}
              onTopicRemoved={(subjectId, topicId) => handleTopicRemoved(publicExam, subjectId, topicId)}
              onTopicUpdated={(subjectId, topicId, newName) => handleTopicUpdated(publicExam, subjectId, topicId, newName)}
              onEditPublicExam={() => setEditingExam(publicExam)}
            />
          </AccordionItem>
        ))}
      </Accordion>

      <EditPublicExamModal
        publicExam={editingExam}
        isOpen={editingExam !== null}
        onClose={() => setEditingExam(null)}
        onSaved={handleExamSaved}
      />
    </>
  );
}
