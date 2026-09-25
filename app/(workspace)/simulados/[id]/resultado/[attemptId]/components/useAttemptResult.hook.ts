'use client';

import { useCallback, useEffect, useState } from 'react';

import { ensureMockExamAnswers, getMockExamAttemptResult } from '@/features/connectors';
import { MockExamResult } from '@/shared/types';

const MAX_ENSURE_ROUNDS = 3;

async function ensureAllAnswers(mockExamId: number) {
  for (let round = 0; round < MAX_ENSURE_ROUNDS; round++) {
    const { generated, remaining } = await ensureMockExamAnswers(mockExamId);

    if (!remaining || generated === 0) return;
  }
}

export function useAttemptResult(mockExamId: number, attemptId: number) {
  const [result, setResult] = useState<MockExamResult | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMockExamAttemptResult(mockExamId, attemptId);

        if (cancelled) return;

        if (data.questions.some((mq) => !mq.examQuestion.answer)) {
          try {
            await ensureAllAnswers(mockExamId);
            const refreshed = await getMockExamAttemptResult(mockExamId, attemptId);

            if (!cancelled) setResult(refreshed);

            return;
          } catch {
            // fall back to whatever we already have — the page flags questions still without gabarito
          }
        }

        setResult(data);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [mockExamId, attemptId, reloadKey]);

  const reload = useCallback(() => {
    setResult(null);
    setLoadFailed(false);
    setReloadKey((key) => key + 1);
  }, []);

  return { result, loadFailed, reload };
}
