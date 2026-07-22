'use client';
import { useState } from 'react';

import { QuizFormErrors } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

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
      const isTimeout =
        error?.code === 'ECONNABORTED' || (typeof error?.message === 'string' && error.message.includes('timeout'));

      notify.error(
        t('toast.error'),
        isTimeout ? t('toast.requestTimeout') : error?.response?.data?.message || t('toast.somethingWrong')
      );
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, request };
}
