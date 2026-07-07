'use client';
import { useCallback, useRef, useState } from 'react';

interface UseTwoPhaseGenerationOptions<TParams extends { num_questions: string }, T> {
  readonly generateFn: (params: TParams) => Promise<T[]>;
  readonly params: TParams;
  readonly totalCount: number;
  readonly firstBatchSize?: number;
  readonly onFirstBatch: (questions: T[]) => void;
  readonly onSecondBatch: (questions: T[]) => void;
  readonly onError: (error: unknown, phase: 1 | 2) => void;
}

function dedup<T extends { id: number }>(questions: T[]): T[] {
  const seen = new Set<number>();
  return questions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

export function useTwoPhaseGeneration<TParams extends { num_questions: string }, T extends { id: number }>({
  generateFn,
  params,
  totalCount,
  firstBatchSize = 5,
  onFirstBatch,
  onSecondBatch,
  onError,
}: UseTwoPhaseGenerationOptions<TParams, T>) {
  const [isFirstPhaseLoading, setIsFirstPhaseLoading] = useState(false);
  const [isSecondPhaseLoading, setIsSecondPhaseLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsFirstPhaseLoading(false);
    setIsSecondPhaseLoading(false);
  }, []);

  const generate = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const phase1Count = Math.min(firstBatchSize, totalCount);
    const phase2Count = totalCount - phase1Count;

    setIsFirstPhaseLoading(true);
    let phase1Questions: T[];
    try {
      phase1Questions = await generateFn({ ...params, num_questions: String(phase1Count) });
    } catch (error) {
      if (controller.signal.aborted) return;
      setIsFirstPhaseLoading(false);
      onError(error, 1);
      return;
    }
    if (controller.signal.aborted) return;
    setIsFirstPhaseLoading(false);
    onFirstBatch(phase1Questions);

    if (phase2Count <= 0) return;

    setIsSecondPhaseLoading(true);
    let phase2Questions: T[];
    try {
      phase2Questions = await generateFn({ ...params, num_questions: String(phase2Count) });
    } catch (error) {
      if (controller.signal.aborted) return;
      setIsSecondPhaseLoading(false);
      onError(error, 2);
      return;
    }
    if (controller.signal.aborted) return;
    setIsSecondPhaseLoading(false);
    onSecondBatch(dedup([...phase1Questions, ...phase2Questions]));
  }, [generateFn, params, totalCount, firstBatchSize, onFirstBatch, onSecondBatch, onError]);

  return { isFirstPhaseLoading, isSecondPhaseLoading, generate, abort };
}
