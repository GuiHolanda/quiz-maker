'use client';
import { useState, useCallback } from 'react';

import { PublicExam, PublicExamSubject, PublicExamTopic } from '@/shared/types';
import { savePublicExam } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

export type ExamDraftStatus = 'editing' | 'saving' | 'saved' | 'error';

export type ExamDraftSaveResult = 'success' | 'duplicate' | 'error';

interface UseExamDraftCardReturn {
  readonly draft: PublicExam;
  readonly status: ExamDraftStatus;
  readonly updateField: (
    field: keyof Pick<PublicExam, 'name' | 'role' | 'year'>,
    value: string | number | null
  ) => void;
  readonly updateNumericField: (
    field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore',
    value: number | undefined
  ) => void;
  readonly updateExamBoardName: (name: string) => void;
  readonly updateSubject: (index: number, patch: Partial<PublicExamSubject>) => void;
  readonly removeSubject: (index: number) => void;
  readonly addSubject: () => void;
  readonly addTopic: (subjectIndex: number, name: string) => void;
  readonly removeTopic: (subjectIndex: number, topicIndex: number) => void;
  readonly updateTopic: (subjectIndex: number, topicIndex: number, newName: string) => void;
  readonly handleSave: () => Promise<ExamDraftSaveResult>;
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

export function useExamDraftCard(initialDraft: PublicExam): UseExamDraftCardReturn {
  const [draft, setDraft] = useState<PublicExam>(initialDraft);
  const [status, setStatus] = useState<ExamDraftStatus>('editing');
  const { t } = useTranslation();

  const updateField = useCallback(
    (field: keyof Pick<PublicExam, 'name' | 'role' | 'year'>, value: string | number | null) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateExamBoardName = useCallback((name: string) => {
    setDraft((prev) => ({ ...prev, examBoard: { ...prev.examBoard, name } }));
  }, []);

  const updateNumericField = useCallback(
    (field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore', value: number | undefined) => {
      setDraft((prev) => ({ ...prev, [field]: value ?? null }));
    },
    []
  );

  const updateSubject = useCallback((index: number, patch: Partial<PublicExamSubject>) => {
    setDraft((prev) => {
      const subjects = [...prev.subjects];
      const updated = { ...subjects[index], ...patch };

      if (patch.minQuestions !== undefined || patch.maxQuestions !== undefined) {
        updated.minQuestions = clampPercent(updated.minQuestions);
        updated.maxQuestions = clampPercent(updated.maxQuestions);

        if (updated.maxQuestions < updated.minQuestions) {
          if (patch.minQuestions !== undefined) {
            updated.maxQuestions = updated.minQuestions;
          } else {
            updated.minQuestions = updated.maxQuestions;
          }
        }
      }

      subjects[index] = updated;

      return { ...prev, subjects };
    });
  }, []);

  const removeSubject = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  }, []);

  const addSubject = useCallback(() => {
    const newSubject: PublicExamSubject = { name: '', minQuestions: 0, maxQuestions: 0, topics: [] };

    setDraft((prev) => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
  }, []);

  const addTopic = useCallback((subjectIndex: number, name: string) => {
    if (!name.trim()) return;
    const newTopic: PublicExamTopic = { name: name.trim() };

    setDraft((prev) => {
      const subjects = [...prev.subjects];

      subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        topics: [...(subjects[subjectIndex].topics ?? []), newTopic],
      };

      return { ...prev, subjects };
    });
  }, []);

  const removeTopic = useCallback((subjectIndex: number, topicIndex: number) => {
    setDraft((prev) => {
      const subjects = [...prev.subjects];

      subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        topics: (subjects[subjectIndex].topics ?? []).filter((_, i) => i !== topicIndex),
      };

      return { ...prev, subjects };
    });
  }, []);

  const updateTopic = useCallback((subjectIndex: number, topicIndex: number, newName: string) => {
    if (!newName.trim()) return;
    setDraft((prev) => {
      const subjects = [...prev.subjects];
      const topics = [...(subjects[subjectIndex].topics ?? [])];

      topics[topicIndex] = { ...topics[topicIndex], name: newName.trim() };
      subjects[subjectIndex] = { ...subjects[subjectIndex], topics };

      return { ...prev, subjects };
    });
  }, []);

  const handleSave = useCallback(async (): Promise<ExamDraftSaveResult> => {
    setStatus('saving');
    try {
      const saved = await savePublicExam(draft);

      setStatus('saved');
      notify.success(t('chat.examSaved'), t('chat.examSavedDescription', { name: draft.name }));
      window.dispatchEvent(new CustomEvent('public-exam-created', { detail: saved }));

      return 'success';
    } catch (err: unknown) {
      const httpStatus = (err as { response?: { status?: number }; status?: number })?.response?.status
        ?? (err as { status?: number })?.status;

      if (httpStatus === 409) {
        notify.error(t('chat.examDuplicate'), t('chat.examDuplicateDescription'));
        setStatus('error');

        return 'duplicate';
      }

      notify.error(t('chat.examSaveError'), t('chat.examSaveErrorDescription'));
      setStatus('error');

      return 'error';
    }
  }, [draft, t]);

  return {
    draft,
    status,
    updateField,
    updateNumericField,
    updateExamBoardName,
    updateSubject,
    removeSubject,
    addSubject,
    addTopic,
    removeTopic,
    updateTopic,
    handleSave,
  };
}
