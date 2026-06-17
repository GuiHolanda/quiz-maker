import type { PublicExam } from '@/shared/types';

export interface PublicExamsState {
  publicExams: PublicExam[];
  selectedPublicExam: PublicExam | null;
  selectedSubjects: string[];
  selectedTopic: string | null;
}

export type PublicExamsAction =
  | { type: 'setState'; payload: { state: PublicExamsState } }
  | { type: 'setPublicExams'; payload: { publicExams: PublicExam[] } }
  | { type: 'setSelectedPublicExam'; payload: { id: string | null } }
  | { type: 'setSelectedSubjects'; payload: { subjects: string[] } }
  | { type: 'setSelectedTopic'; payload: { topic: string | null } }
  | { type: 'addPublicExam'; payload: { publicExam: PublicExam } }
  | { type: 'removePublicExam'; payload: { id: string } }
  | { type: 'updatePublicExam'; payload: { id: string; publicExam: Partial<PublicExam> } };

export function publicExamsReducer(state: PublicExamsState, action: PublicExamsAction): PublicExamsState {
  switch (action.type) {
    case 'setState':
      return action.payload.state;
    case 'setPublicExams':
      return { ...state, publicExams: action.payload.publicExams };
    case 'setSelectedPublicExam':
      return {
        ...state,
        selectedPublicExam: state.publicExams.find((p) => p.id === action.payload.id) || null,
      };
    case 'setSelectedSubjects':
      return { ...state, selectedSubjects: action.payload.subjects };
    case 'setSelectedTopic':
      return { ...state, selectedTopic: action.payload.topic };
    case 'addPublicExam':
      return { ...state, publicExams: [...state.publicExams, action.payload.publicExam] };
    case 'removePublicExam':
      return { ...state, publicExams: state.publicExams.filter((p) => p.id !== action.payload.id) };
    case 'updatePublicExam': {
      const newExams = state.publicExams.map((p) =>
        p.id === action.payload.id ? { ...p, ...action.payload.publicExam } : p
      );
      const updatedSelected =
        state.selectedPublicExam && state.selectedPublicExam.id === action.payload.id
          ? { ...state.selectedPublicExam, ...action.payload.publicExam }
          : state.selectedPublicExam;

      return {
        ...state,
        publicExams: newExams,
        selectedPublicExam: updatedSelected,
      };
    }
    default:
      return state;
  }
}

export default publicExamsReducer;
