import { MockExamListItem } from '@/shared/types';

export interface MockExamsState {
  mockExams: MockExamListItem[];
  isLoading: boolean;
}

type MockExamsAction =
  | { type: 'setMockExams'; payload: MockExamListItem[] }
  | { type: 'addMockExam'; payload: MockExamListItem }
  | { type: 'removeMockExam'; payload: number }
  | { type: 'setLoading'; payload: boolean };

export function mockExamsReducer(state: MockExamsState, action: MockExamsAction): MockExamsState {
  switch (action.type) {
    case 'setMockExams':
      return { ...state, mockExams: action.payload, isLoading: false };
    case 'addMockExam':
      return { ...state, mockExams: [...state.mockExams, action.payload] };
    case 'removeMockExam':
      return { ...state, mockExams: state.mockExams.filter((m) => m.id !== action.payload) };
    case 'setLoading':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}
