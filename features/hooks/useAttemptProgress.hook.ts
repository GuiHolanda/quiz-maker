'use client';

import { useCallback, useState } from 'react';

import { SIMULADO_ATTEMPT_PROGRESS_KEY } from '@/config/constants';
import { AnswersMap } from '@/shared/types';

export function useAttemptProgress(attemptId: number) {
  const [answers, setAnswers] = useState<AnswersMap>(() => {
    try {
      const stored = localStorage.getItem(SIMULADO_ATTEMPT_PROGRESS_KEY(attemptId));
      if (stored) return JSON.parse(stored) as AnswersMap;
    } catch {
      // ignore parse errors or unavailable storage
    }
    return {};
  });

  const handleAnswerChange = useCallback(
    (questionId: number, selected: string[]) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: selected };
        try {
          localStorage.setItem(SIMULADO_ATTEMPT_PROGRESS_KEY(attemptId), JSON.stringify(next));
        } catch {
          // ignore unavailable storage
        }
        return next;
      });
    },
    [attemptId]
  );

  const clearProgress = useCallback(() => {
    localStorage.removeItem(SIMULADO_ATTEMPT_PROGRESS_KEY(attemptId));
    setAnswers({});
  }, [attemptId]);

  return { answers, handleAnswerChange, clearProgress };
}
