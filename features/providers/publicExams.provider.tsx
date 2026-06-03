import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { PublicExam, PublicExamsStoreApi } from '@/shared/types';
import { PUBLIC_EXAMS_LOCAL_STORAGE_KEY, INITIAL_PUBLIC_EXAMS_STATE } from '@/config/constants';
import { publicExamsReducer } from '../reducers/publicExams.reducer';
import { getPublicExams } from '../connectors';

export const PublicExamsContext = React.createContext<PublicExamsStoreApi | null>(null);

export function PublicExamsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(publicExamsReducer, INITIAL_PUBLIC_EXAMS_STATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PUBLIC_EXAMS_LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({
          type: 'setSelectedPublicExam',
          payload: { id: parsed?.selectedPublicExam?.id ?? null },
        });
        dispatch({ type: 'setSelectedSubjects', payload: { subjects: parsed?.selectedSubjects ?? [] } });
        dispatch({ type: 'setSelectedTopic', payload: { topic: parsed?.selectedTopic ?? null } });
      }
    } catch (err) {
      console.warn('Failed to read UI state from storage', err);
    }

    getPublicExams()
      .then((exams) => dispatch({ type: 'setPublicExams', payload: { publicExams: exams } }))
      .catch(() => {
        try {
          const raw = localStorage.getItem(PUBLIC_EXAMS_LOCAL_STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.publicExams)) {
            dispatch({ type: 'setPublicExams', payload: { publicExams: parsed.publicExams } });
          }
        } catch {}
      });
  }, []);

  useEffect(() => {
    try {
      const toStore = {
        selectedPublicExam: state.selectedPublicExam,
        selectedSubjects: state.selectedSubjects,
        selectedTopic: state.selectedTopic,
      };
      localStorage.setItem(PUBLIC_EXAMS_LOCAL_STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.warn('Persist public exams failed', err);
    }
  }, [state.selectedPublicExam, state.selectedSubjects, state.selectedTopic]);

  useEffect(() => {
    const handler = (e: Event) => {
      const exam = (e as CustomEvent<PublicExam>).detail;
      if (exam) dispatch({ type: 'addPublicExam', payload: { publicExam: exam } });
    };
    window.addEventListener('public-exam-created', handler);
    return () => window.removeEventListener('public-exam-created', handler);
  }, []);

  const setPublicExams = useCallback(
    (exams: PublicExam[]) => dispatch({ type: 'setPublicExams', payload: { publicExams: exams } }),
    [],
  );

  const setSelectedPublicExam = useCallback(
    (exam: PublicExam | null) => dispatch({ type: 'setSelectedPublicExam', payload: { id: exam?.id ?? null } }),
    [],
  );

  const setSelectedSubjects = useCallback(
    (subjects: string[]) => dispatch({ type: 'setSelectedSubjects', payload: { subjects } }),
    [],
  );

  const setSelectedTopic = useCallback(
    (topic: string | null) => dispatch({ type: 'setSelectedTopic', payload: { topic } }),
    [],
  );

  const addPublicExam = useCallback(
    (exam: PublicExam) => dispatch({ type: 'addPublicExam', payload: { publicExam: exam } }),
    [],
  );

  const removePublicExam = useCallback(
    (id: string) => dispatch({ type: 'removePublicExam', payload: { id } }),
    [],
  );

  const updatePublicExam = useCallback(
    (id: string, patch: Partial<PublicExam>) =>
      dispatch({ type: 'updatePublicExam', payload: { id, publicExam: patch } }),
    [],
  );

  const api = useMemo<PublicExamsStoreApi>(
    () => ({
      publicExams: state.publicExams,
      selectedPublicExam: state.selectedPublicExam,
      selectedSubjects: state.selectedSubjects,
      selectedTopic: state.selectedTopic,
      setPublicExams,
      setSelectedPublicExam,
      setSelectedSubjects,
      setSelectedTopic,
      addPublicExam,
      removePublicExam,
      updatePublicExam,
    }),
    [
      state.publicExams,
      state.selectedPublicExam,
      state.selectedSubjects,
      state.selectedTopic,
      setPublicExams,
      setSelectedPublicExam,
      setSelectedSubjects,
      setSelectedTopic,
      addPublicExam,
      removePublicExam,
      updatePublicExam,
    ],
  );

  return <PublicExamsContext.Provider value={api}>{children}</PublicExamsContext.Provider>;
}

export default PublicExamsProvider;
