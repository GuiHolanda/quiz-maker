'use client';

import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import { MockExamListItem } from '@/shared/types';
import { mockExamsReducer, MockExamsState } from '@/features/reducers/mockExams.reducer';
import { INITIAL_MOCK_EXAMS_STATE, MOCK_EXAMS_LOCAL_STORAGE_KEY } from '@/config/constants';
import { getMockExams } from '@/features/connectors';

interface MockExamsContextValue extends MockExamsState {
  setMockExams: (mockExams: MockExamListItem[]) => void;
  addMockExam: (mockExam: MockExamListItem) => void;
  removeMockExam: (id: number) => void;
  refresh: () => Promise<void>;
}

const MockExamsContext = createContext<MockExamsContextValue | null>(null);

export function MockExamsProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mockExamsReducer, INITIAL_MOCK_EXAMS_STATE);

  const refresh = useCallback(async () => {
    try {
      const mockExams = await getMockExams();

      dispatch({ type: 'setMockExams', payload: mockExams });
    } catch {
      const stored = localStorage.getItem(MOCK_EXAMS_LOCAL_STORAGE_KEY);

      if (stored) {
        try {
          dispatch({ type: 'setMockExams', payload: JSON.parse(stored) });
        } catch {
          // ignore
        }
      }
    } finally {
      dispatch({ type: 'setLoading', payload: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(MOCK_EXAMS_LOCAL_STORAGE_KEY, JSON.stringify(state.mockExams));
  }, [state.mockExams]);

  const value: MockExamsContextValue = {
    ...state,
    setMockExams: (mockExams) => dispatch({ type: 'setMockExams', payload: mockExams }),
    addMockExam: (mockExam) => dispatch({ type: 'addMockExam', payload: mockExam }),
    removeMockExam: (id) => dispatch({ type: 'removeMockExam', payload: id }),
    refresh,
  };

  return <MockExamsContext.Provider value={value}>{children}</MockExamsContext.Provider>;
}

export function useMockExamsContext(): MockExamsContextValue {
  const ctx = useContext(MockExamsContext);

  if (!ctx) throw new Error('useMockExamsContext must be used inside MockExamsProvider');

  return ctx;
}
