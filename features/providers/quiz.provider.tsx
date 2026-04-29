import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { AIQuestion, AnswersMap, QuizLocalStoragePayload, QuizStoreApi } from '@/shared/types';
import { QUIZ_LOCAL_STORAGE_KEY } from '@/config/constants';
import { quizReducer } from '../reducers/quiz.reducer';

export const QuizContext = React.createContext<QuizStoreApi | null>(null);

export function QuizProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(quizReducer, null as any);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_LOCAL_STORAGE_KEY);
      if (raw) dispatch({ type: 'init', payload: JSON.parse(raw) as QuizLocalStoragePayload });
    } catch (err) {
      console.warn('Failed to read quiz from storage', err);
    }
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(QUIZ_LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Persist quiz failed', err);
    }
  }, [state]);

  const setAIquestions = useCallback(
  (aiQuestions: AIQuestion[], selectedAIQuestions: number[] | null) => {
      dispatch({ type: 'updateAIQuestions', payload: { aiQuestions, selectedAIQuestions } });
    },
    []
  );

  const setSelectedAIquestions = useCallback(
    (selectedAIQuestions: number[] | null) => {
      dispatch({ type: 'updateSelectedAIQuestions', payload: { selectedAIQuestions } });
    },
    []
  );

  const setAnswers = useCallback((answers: AnswersMap) => {
    dispatch({ type: 'setAnswers', payload: { answers } });
  }, []);

  const replaceQuiz = useCallback((payload: QuizLocalStoragePayload) => {
    dispatch({ type: 'replace', payload });
  }, []);

  const setFinished = useCallback((isFinished: boolean) => {
    dispatch({ type: 'setFinished', payload: { isFinished } });
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(QUIZ_LOCAL_STORAGE_KEY);
    } catch {}
    dispatch({ type: 'clear' });
  }, []);

  const api = useMemo<QuizStoreApi>(
    () => ({ state: state ?? null, setAIquestions, setSelectedAIquestions, setAnswers, replaceQuiz, setFinished, clear }),
    [state, setAIquestions, setSelectedAIquestions, setAnswers, replaceQuiz, setFinished, clear]
  );

  return <QuizContext.Provider value={api}>{children}</QuizContext.Provider>;
}
