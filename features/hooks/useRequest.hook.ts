'use client';
import { useState } from 'react';
import { addToast } from '@heroui/toast';

import { QuizFormErrors } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function useRequest(requestMethod: (args: any) => Promise<any>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<QuizFormErrors>({});
  const { t } = useTranslation();

  const request = async (payload: any, onSuccess?: () => void) => {
    setLoading(true);
    setError({});

    try {
      const questionare = await requestMethod(payload);

      if (onSuccess) onSuccess();

      return questionare;
    } catch (error: any) {
      queueMicrotask(() => setError(error));
      addToast({
        title: t('toast.failedToLoad'),
        description: error?.response?.data?.message || t('toast.somethingWrong'),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, request };
}
