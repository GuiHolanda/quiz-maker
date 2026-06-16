import { MockExamListItem } from '@/shared/types';

export interface MockExamsState {
  mockExams: MockExamListItem[];
}

type MockExamsAction =
  | { type: 'setMockExams'; payload: MockExamListItem[] }
  | { type: 'addMockExam'; payload: MockExamListItem }
  | { type: 'removeMockExam'; payload: number };

export function mockExamsReducer(state: MockExamsState, action: MockExamsAction): MockExamsState {
  switch (action.type) {
    case 'setMockExams':
      return { ...state, mockExams: action.payload };
    case 'addMockExam':
      return { ...state, mockExams: [...state.mockExams, action.payload] };
    case 'removeMockExam':
      return { ...state, mockExams: state.mockExams.filter((m) => m.id !== action.payload) };
    default:
      return state;
  }
}
