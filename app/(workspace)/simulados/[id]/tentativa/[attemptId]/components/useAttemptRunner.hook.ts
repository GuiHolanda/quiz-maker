'use client';

import { useCallback, useMemo, useState } from 'react';

import { AnswersMap } from '@/shared/types';

export interface AttemptQuestion {
  readonly mockExamQuestionId: number;
  readonly examQuestionId: number;
  readonly order: number;
  readonly text: string;
  readonly correctCount: number;
  readonly topic: string;
  readonly options: Record<string, string>;
}

export type NavigatorStatus = 'current' | 'answered' | 'skipped' | 'unvisited';

export interface NavigatorItem {
  readonly n: number;
  readonly status: NavigatorStatus;
  readonly answered: boolean;
}

export interface AttemptDerivedState {
  readonly answeredCount: number;
  readonly skippedCount: number;
  readonly openCount: number;
  readonly unvisitedCount: number;
  readonly progressPercent: number;
  readonly navigatorItems: NavigatorItem[];
}

export function isQuestionAnswered(question: AttemptQuestion, answers: AnswersMap): boolean {
  const selected = answers[question.examQuestionId] ?? [];
  return selected.length >= Math.max(1, question.correctCount);
}

export function deriveAttemptState(
  questions: AttemptQuestion[],
  answers: AnswersMap,
  skipped: Set<number>,
  currentIndex: number
): AttemptDerivedState {
  const total = questions.length;
  const answeredCount = questions.filter((question) => isQuestionAnswered(question, answers)).length;
  const skippedCount = questions.filter(
    (question) => skipped.has(question.examQuestionId) && !isQuestionAnswered(question, answers)
  ).length;
  const openCount = total - answeredCount;
  const unvisitedCount = Math.max(0, total - answeredCount - skippedCount);
  const progressPercent = total ? Math.round((answeredCount / total) * 100) : 0;

  const navigatorItems: NavigatorItem[] = questions.map((question, index) => {
    const answered = isQuestionAnswered(question, answers);
    const status: NavigatorStatus =
      index === currentIndex
        ? 'current'
        : answered
          ? 'answered'
          : skipped.has(question.examQuestionId)
            ? 'skipped'
            : 'unvisited';
    return { n: index + 1, status, answered };
  });

  return { answeredCount, skippedCount, openCount, unvisitedCount, progressPercent, navigatorItems };
}

export function useAttemptRunner(questions: AttemptQuestion[], answers: AnswersMap) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skipped, setSkipped] = useState<Set<number>>(() => new Set());

  const total = questions.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(total - 1, index)));
    },
    [total]
  );

  const next = useCallback(() => {
    setCurrentIndex((index) => Math.min(total - 1, index + 1));
  }, [total]);

  const prev = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const skip = useCallback(() => {
    const question = questions[currentIndex];
    if (question) {
      setSkipped((previous) => {
        const nextSet = new Set(previous);
        nextSet.add(question.examQuestionId);
        return nextSet;
      });
    }
    setCurrentIndex((index) => Math.min(total - 1, index + 1));
  }, [questions, currentIndex, total]);

  const derived = useMemo(
    () => deriveAttemptState(questions, answers, skipped, currentIndex),
    [questions, answers, skipped, currentIndex]
  );

  const currentQuestion = questions[currentIndex] ?? null;

  return {
    currentIndex,
    currentQuestion,
    total,
    isFirst: currentIndex === 0,
    isLast: currentIndex === total - 1,
    isAnswered: (question: AttemptQuestion) => isQuestionAnswered(question, answers),
    goTo,
    next,
    prev,
    skip,
    ...derived,
  };
}
