'use client';

import type { MockExamAvailability } from '@/shared/types';

import { useEffect, useState } from 'react';

import { getMockExamAvailability } from '@/features/connectors';

export function useSimuladoAvailability(examId: string | null | undefined): MockExamAvailability | null {
  const [availability, setAvailability] = useState<MockExamAvailability | null>(null);

  useEffect(() => {
    if (!examId) {
      setAvailability(null);

      return;
    }

    setAvailability(null);

    let cancelled = false;

    getMockExamAvailability(examId)
      .then((result) => {
        if (!cancelled) setAvailability(result);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      });

    return () => {
      cancelled = true;
    };
  }, [examId]);

  return availability;
}
