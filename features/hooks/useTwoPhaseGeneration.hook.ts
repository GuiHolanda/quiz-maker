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

  const paramsRef = useRef(params);
  paramsRef.current = params;
  const generateFnRef = useRef(generateFn);
  generateFnRef.current = generateFn;
  const onFirstBatchRef = useRef(onFirstBatch);
  onFirstBatchRef.current = onFirstBatch;
  const onSecondBatchRef = useRef(onSecondBatch);
  onSecondBatchRef.current = onSecondBatch;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Clears loading state and prevents stale updates; does not cancel the in-flight network request
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

    setIsFirstPhaseLoading(false);
    setIsSecondPhaseLoading(false);

    const currentParams = paramsRef.current;
    const phase1Count = Math.min(firstBatchSize, totalCount);
    const phase2Count = totalCount - phase1Count;

    setIsFirstPhaseLoading(true);
    let phase1Questions: T[];
    try {
      phase1Questions = await generateFnRef.current({ ...currentParams, num_questions: String(phase1Count) });
    } catch (error) {
      if (controller.signal.aborted) return;
      setIsFirstPhaseLoading(false);
      onErrorRef.current(error, 1);
      return;
    }
    if (controller.signal.aborted) return;
    setIsFirstPhaseLoading(false);
    onFirstBatchRef.current(phase1Questions);

    if (phase2Count <= 0) return;

    setIsSecondPhaseLoading(true);
    let phase2Questions: T[];
    try {
      phase2Questions = await generateFnRef.current({ ...currentParams, num_questions: String(phase2Count) });
    } catch (error) {
      if (controller.signal.aborted) return;
      setIsSecondPhaseLoading(false);
      onErrorRef.current(error, 2);
      return;
    }
    if (controller.signal.aborted) return;
    setIsSecondPhaseLoading(false);
    onSecondBatchRef.current(dedup([...phase1Questions, ...phase2Questions]));
  }, [firstBatchSize, totalCount]);

  return { isFirstPhaseLoading, isSecondPhaseLoading, generate, abort };
}
