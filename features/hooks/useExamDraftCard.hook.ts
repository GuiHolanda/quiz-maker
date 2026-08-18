'use client';
import { useState, useCallback } from 'react';

import { Exam, ExamSection, ExamTopic } from '@/shared/types';
import type { QuestionFormatKey } from '@/config/question-formats';
import { saveExam, updateExam } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

export type ExamDraftStatus = 'editing' | 'saving' | 'saved' | 'error';

export type ExamDraftSaveResult = 'success' | 'duplicate' | 'error';

interface UseExamDraftCardReturn {
  readonly draft: Exam;
  readonly status: ExamDraftStatus;
  readonly updateField: (
    field: keyof Pick<Exam, 'name' | 'role' | 'year' | 'key'>,
    value: string | number | null
  ) => void;
  readonly updateNumericField: (
    field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore',
    value: number | undefined
  ) => void;
  readonly updateReferenceName: (name: string) => void;
  readonly updateSection: (index: number, patch: Partial<ExamSection>) => void;
  readonly removeSection: (index: number) => void;
  readonly addSection: () => void;
  readonly addTopic: (sectionIndex: number, name: string) => void;
  readonly removeTopic: (sectionIndex: number, topicIndex: number) => void;
  readonly updateTopic: (sectionIndex: number, topicIndex: number, newName: string) => void;
  readonly updateQuestionFormat: (format: QuestionFormatKey) => void;
  readonly handleSave: () => Promise<ExamDraftSaveResult>;
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

export function useExamDraftCard(initialDraft: Exam, mode: 'create' | 'edit' = 'create'): UseExamDraftCardReturn {
  const [draft, setDraft] = useState<Exam>(initialDraft);
  const [status, setStatus] = useState<ExamDraftStatus>('editing');
  const { t } = useTranslation();

  const updateField = useCallback(
    (field: keyof Pick<Exam, 'name' | 'role' | 'year' | 'key'>, value: string | number | null) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateReferenceName = useCallback((name: string) => {
    setDraft((prev) => {
      if (prev.type === 'certification') {
        return { ...prev, provider: { ...(prev.provider ?? {}), name } };
      }

      return { ...prev, examBoard: { ...(prev.examBoard ?? {}), name } };
    });
  }, []);

  const updateQuestionFormat = useCallback((format: QuestionFormatKey) => {
    setDraft((prev) => ({ ...prev, questionFormat: format }));
  }, []);

  const updateNumericField = useCallback(
    (field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore', value: number | undefined) => {
      setDraft((prev) => ({ ...prev, [field]: value ?? null }));
    },
    []
  );

  const updateSection = useCallback((index: number, patch: Partial<ExamSection>) => {
    setDraft((prev) => {
      const sections = [...prev.sections];
      const updated = { ...sections[index], ...patch };

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

      sections[index] = updated;

      return { ...prev, sections };
    });
  }, []);

  const removeSection = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  }, []);

  const addSection = useCallback(() => {
    const newSection: ExamSection = { name: '', minQuestions: 0, maxQuestions: 0, topics: [] };

    setDraft((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
  }, []);

  const addTopic = useCallback((sectionIndex: number, name: string) => {
    if (!name.trim()) return;
    const newTopic: ExamTopic = { name: name.trim() };

    setDraft((prev) => {
      const sections = [...prev.sections];

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        topics: [...(sections[sectionIndex].topics ?? []), newTopic],
      };

      return { ...prev, sections };
    });
  }, []);

  const removeTopic = useCallback((sectionIndex: number, topicIndex: number) => {
    setDraft((prev) => {
      const sections = [...prev.sections];

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        topics: (sections[sectionIndex].topics ?? []).filter((_, i) => i !== topicIndex),
      };

      return { ...prev, sections };
    });
  }, []);

  const updateTopic = useCallback((sectionIndex: number, topicIndex: number, newName: string) => {
    if (!newName.trim()) return;
    setDraft((prev) => {
      const sections = [...prev.sections];
      const topics = [...(sections[sectionIndex].topics ?? [])];

      topics[topicIndex] = { ...topics[topicIndex], name: newName.trim() };
      sections[sectionIndex] = { ...sections[sectionIndex], topics };

      return { ...prev, sections };
    });
  }, []);

  const handleSave = useCallback(async (): Promise<ExamDraftSaveResult> => {
    if (!draft.key?.trim()) {
      notify.error(
        t('toast.validationError'),
        draft.type === 'certification' ? t('error.keyRequired') : t('error.editalKeyRequired')
      );
      return 'error';
    }
    setStatus('saving');
    try {
      const saved = mode === 'edit' && draft.id ? await updateExam(draft.id, draft) : await saveExam(draft);

      setStatus('saved');
      notify.success(t('exam.saved'), t('exam.savedDescription', { name: draft.name }));
      if (mode !== 'edit') window.dispatchEvent(new CustomEvent('exam-created', { detail: saved }));

      return 'success';
    } catch (err: unknown) {
      const httpStatus =
        (err as { response?: { status?: number }; status?: number })?.response?.status ??
        (err as { status?: number })?.status;

      if (httpStatus === 409) {
        notify.error(t('exam.duplicate'), t('exam.duplicateDescription'));
        setStatus('error');

        return 'duplicate';
      }

      // The only quota check on this endpoint is create_exam's maxExams cap — any 403 here
      // means that limit, not a permissions issue. The server drops the structured
      // { limit, used, plan } payload down to a plain English message (see lib/api-error.ts),
      // so we can't show the exact number, but a clear localized message beats a raw pass-through.
      if (httpStatus === 403) {
        notify.error(t('exam.examLimitReached'), t('exam.examLimitReachedDescription'));
        setStatus('error');

        return 'error';
      }

      notify.error(t('exam.saveError'), t('exam.saveErrorDescription'));
      setStatus('error');

      return 'error';
    }
  }, [draft, t]);

  return {
    draft,
    status,
    updateField,
    updateNumericField,
    updateReferenceName,
    updateSection,
    removeSection,
    addSection,
    addTopic,
    removeTopic,
    updateTopic,
    updateQuestionFormat,
    handleSave,
  };
}
