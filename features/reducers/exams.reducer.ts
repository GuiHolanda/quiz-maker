import type { Exam, ExamSection, ExamTopic } from '@/shared/types';

export interface ExamsState {
  exams: Exam[];
  selectedExam: Exam | null;
  selectedSections: ExamSection[];
  selectedTopic: ExamTopic | null;
  isLoading: boolean;
}

export type ExamsAction =
  | { type: 'setState'; payload: { state: ExamsState } }
  | { type: 'setExams'; payload: { exams: Exam[] } }
  | { type: 'selectExam'; payload: { id: string | null } }
  | { type: 'setSelectedSections'; payload: { sections: ExamSection[] } }
  | { type: 'selectTopic'; payload: { topic: ExamTopic | null } }
  | { type: 'addExam'; payload: { exam: Exam } }
  | { type: 'removeExam'; payload: { id: string } }
  | { type: 'updateExam'; payload: { id: string; exam: Partial<Exam> } }
  | { type: 'setLoading'; payload: { isLoading: boolean } };

export function examsReducer(state: ExamsState, action: ExamsAction): ExamsState {
  switch (action.type) {
    case 'setState':
      return action.payload.state;
    case 'setExams':
      return { ...state, exams: action.payload.exams, isLoading: false };
    case 'selectExam':
      return { ...state, selectedExam: state.exams.find((e) => e.id === action.payload.id) || null };
    case 'setSelectedSections':
      return { ...state, selectedSections: action.payload.sections };
    case 'selectTopic':
      return { ...state, selectedTopic: action.payload.topic };
    case 'addExam':
      return { ...state, exams: [...state.exams, action.payload.exam] };
    case 'removeExam':
      return { ...state, exams: state.exams.filter((e) => e.id !== action.payload.id) };
    case 'updateExam': {
      const newExams = state.exams.map((e) =>
        e.id === action.payload.id ? { ...e, ...action.payload.exam } : e
      );
      const updatedSelected =
        state.selectedExam && state.selectedExam.id === action.payload.id
          ? { ...state.selectedExam, ...action.payload.exam }
          : state.selectedExam;

      return { ...state, exams: newExams, selectedExam: updatedSelected };
    }
    case 'setLoading':
      return { ...state, isLoading: action.payload.isLoading };
    default:
      return state;
  }
}

export default examsReducer;
