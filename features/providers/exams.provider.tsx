'use client';

import type { Exam, ExamSection, ExamTopic } from '@/shared/types';

import React, { useReducer, useEffect, useRef, useCallback, useMemo } from 'react';

import { examsReducer, ExamsState } from '../reducers/exams.reducer';
import { getExams } from '../connectors';

import { EXAMS_LOCAL_STORAGE_KEY, INITIAL_EXAMS_STATE } from '@/config/constants';

export interface ExamsStoreApi {
  exams: Exam[];
  certifications: Exam[];
  publicExams: Exam[];
  selectedExam: Exam | null;
  selectedSections: ExamSection[];
  selectedTopic: ExamTopic | null;
  isLoading: boolean;
  setExams: (exams: Exam[]) => void;
  selectExam: (exam: Exam | null) => void;
  setSelectedSections: (sections: ExamSection[]) => void;
  selectTopic: (topic: ExamTopic | null) => void;
  addExam: (exam: Exam) => void;
  removeExam: (id: string) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
}

export const ExamsContext = React.createContext<ExamsStoreApi | null>(null);

export function ExamsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(examsReducer, INITIAL_EXAMS_STATE);
  const hydrated = useRef(false);

  useEffect(() => {
    let storedId: string | null = null;

    try {
      const raw = localStorage.getItem(EXAMS_LOCAL_STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        storedId = parsed?.selectedExam?.id ?? null;
      }
    } catch (err) {
      console.warn('Failed to read UI state from storage', err);
    }

    getExams()
      .then((exams) => {
        dispatch({ type: 'setExams', payload: { exams } });
        if (storedId) dispatch({ type: 'selectExam', payload: { id: storedId } });
        hydrated.current = true;
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(EXAMS_LOCAL_STORAGE_KEY);

          if (!raw) {
            hydrated.current = true;
            return;
          }
          const parsed = JSON.parse(raw);

          if (Array.isArray(parsed?.exams)) {
            dispatch({ type: 'setExams', payload: { exams: parsed.exams } });
            if (storedId) dispatch({ type: 'selectExam', payload: { id: storedId } });
          }
        } catch {}
        hydrated.current = true;
      })
      .finally(() => dispatch({ type: 'setLoading', payload: { isLoading: false } }));
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const toStore = { selectedExam: state.selectedExam };

      localStorage.setItem(EXAMS_LOCAL_STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.warn('Persist exams failed', err);
    }
  }, [state.selectedExam]);

  useEffect(() => {
    const handler = (e: Event) => {
      const exam = (e as CustomEvent<Exam>).detail;

      if (exam) dispatch({ type: 'addExam', payload: { exam } });
    };

    window.addEventListener('exam-created', handler);

    return () => window.removeEventListener('exam-created', handler);
  }, []);

  const setExams = useCallback((exams: Exam[]) => dispatch({ type: 'setExams', payload: { exams } }), []);
  const selectExam = useCallback((exam: Exam | null) => dispatch({ type: 'selectExam', payload: { id: exam?.id || null } }), []);
  const setSelectedSections = useCallback(
    (sections: ExamSection[]) => dispatch({ type: 'setSelectedSections', payload: { sections } }),
    []
  );
  const selectTopic = useCallback((topic: ExamTopic | null) => dispatch({ type: 'selectTopic', payload: { topic } }), []);
  const addExam = useCallback((exam: Exam) => dispatch({ type: 'addExam', payload: { exam } }), []);
  const removeExam = useCallback((id: string) => dispatch({ type: 'removeExam', payload: { id } }), []);
  const updateExam = useCallback(
    (id: string, patch: Partial<Exam>) => dispatch({ type: 'updateExam', payload: { id, exam: patch } }),
    []
  );

  const certifications = useMemo(() => state.exams.filter((e) => e.type === 'certification'), [state.exams]);
  const publicExams = useMemo(() => state.exams.filter((e) => e.type === 'public_exam'), [state.exams]);

  const api = useMemo<ExamsStoreApi>(
    () => ({
      exams: state.exams,
      certifications,
      publicExams,
      selectedExam: state.selectedExam,
      selectedSections: state.selectedSections,
      selectedTopic: state.selectedTopic,
      isLoading: state.isLoading,
      setExams,
      selectExam,
      setSelectedSections,
      selectTopic,
      addExam,
      removeExam,
      updateExam,
    }),
    [
      state.exams,
      certifications,
      publicExams,
      state.selectedExam,
      state.selectedSections,
      state.selectedTopic,
      state.isLoading,
      setExams,
      selectExam,
      setSelectedSections,
      selectTopic,
      addExam,
      removeExam,
      updateExam,
    ]
  );

  return <ExamsContext.Provider value={api}>{children}</ExamsContext.Provider>;
}

export type { ExamsState };
export default ExamsProvider;
