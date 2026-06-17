'use client';
import { useState, useCallback } from 'react';
import { addToast } from '@heroui/toast';

import { PublicExam, PublicExamSubject, PublicExamTopic } from '@/shared/types';
import { savePublicExam } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export type ExamDraftStatus = 'editing' | 'saving' | 'saved' | 'error';

interface UseExamDraftCardReturn {
  readonly draft: PublicExam;
  readonly status: ExamDraftStatus;
  readonly updateField: (
    field: keyof Pick<PublicExam, 'name' | 'role' | 'year'>,
    value: string | number | null
  ) => void;
  readonly updateExamBoardName: (name: string) => void;
  readonly updateSubject: (index: number, patch: Partial<PublicExamSubject>) => void;
  readonly removeSubject: (index: number) => void;
  readonly addSubject: () => void;
  readonly addTopic: (subjectIndex: number, name: string) => void;
  readonly removeTopic: (subjectIndex: number, topicIndex: number) => void;
  readonly updateTopic: (subjectIndex: number, topicIndex: number, newName: string) => void;
  readonly handleSave: () => Promise<void>;
}

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

  const updateSubject = useCallback((index: number, patch: Partial<PublicExamSubject>) => {
    setDraft((prev) => {
      const subjects = [...prev.subjects];

      subjects[index] = { ...subjects[index], ...patch };

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

  const handleSave = useCallback(async () => {
    setStatus('saving');
    try {
      const saved = await savePublicExam(draft);

      setStatus('saved');
      addToast({ title: t('chat.examSaved'), color: 'success' });
      window.dispatchEvent(new CustomEvent('public-exam-created', { detail: saved }));
    } catch (err: any) {
      const message = err?.response?.status === 409 ? t('chat.examDuplicate') : t('chat.examSaveError');

      addToast({ title: message, color: 'danger' });
      setStatus('editing');
    }
  }, [draft, t]);

  return {
    draft,
    status,
    updateField,
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
