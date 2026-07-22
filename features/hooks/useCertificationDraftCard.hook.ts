'use client';
import { useState, useCallback } from 'react';

import { Certification, CertificationTopic } from '@/shared/types';
import { saveCertification } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

export type CertificationDraftStatus = 'editing' | 'saving' | 'saved' | 'error';

export type CertificationDraftSaveResult = 'success' | 'duplicate' | 'error';

interface UseCertificationDraftCardReturn {
  readonly draft: Certification;
  readonly status: CertificationDraftStatus;
  readonly updateField: (field: 'label' | 'key' | 'provider', value: string) => void;
  readonly updateNumericField: (field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore', value: number | undefined) => void;
  readonly updateTopic: (index: number, patch: Partial<CertificationTopic>) => void;
  readonly addTopic: () => void;
  readonly removeTopic: (index: number) => void;
  readonly handleSave: () => Promise<CertificationDraftSaveResult>;
}

export function useCertificationDraftCard(initialDraft: Certification): UseCertificationDraftCardReturn {
  const [draft, setDraft] = useState<Certification>(initialDraft);
  const [status, setStatus] = useState<CertificationDraftStatus>('editing');
  const { t } = useTranslation();

  const updateField = useCallback((field: 'label' | 'key' | 'provider', value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateNumericField = useCallback(
    (field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore', value: number | undefined) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateTopic = useCallback((index: number, patch: Partial<CertificationTopic>) => {
    setDraft((prev) => {
      const topics = [...prev.topics];

      topics[index] = { ...topics[index], ...patch };

      return { ...prev, topics };
    });
  }, []);

  const addTopic = useCallback(() => {
    const newTopic: CertificationTopic = { name: '', minQuestions: 0, maxQuestions: 0 };

    setDraft((prev) => ({ ...prev, topics: [...prev.topics, newTopic] }));
  }, []);

  const removeTopic = useCallback((index: number) => {
    setDraft((prev) => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }));
  }, []);

  const handleSave = useCallback(async (): Promise<CertificationDraftSaveResult> => {
    setStatus('saving');
    try {
      const saved = await saveCertification(draft);

      setStatus('saved');
      notify.success(t('chat.created'), t('chat.createdDescription', { name: draft.label }));
      window.dispatchEvent(new CustomEvent('certification-created', { detail: saved }));

      return 'success';
    } catch (err: any) {
      const httpStatus = err?.response?.status ?? err?.status;

      if (httpStatus === 409) {
        notify.error(t('chat.errorDuplicate', { key: draft.key }), t('chat.errorDuplicateDescription'));
        setStatus('editing');

        return 'duplicate';
      }

      notify.error(t('chat.errorGeneric'), t('chat.errorGenericDescription'));
      setStatus('editing');

      return 'error';
    }
  }, [draft, t]);

  return {
    draft,
    status,
    updateField,
    updateNumericField,
    updateTopic,
    addTopic,
    removeTopic,
    handleSave,
  };
}
