import type { AIQuestion, AnswersMap, QuizLocalStoragePayload } from '@/shared/types';

export type QuizState = Readonly<QuizLocalStoragePayload> | null;

export type QuizAction =
  | { type: 'init'; payload: QuizLocalStoragePayload }
  | { type: 'updateAIQuestions'; payload: { aiQuestions: AIQuestion[]; selectedAIQuestions: number[] | null } }
  | { type: 'updateSelectedAIQuestions'; payload: { selectedAIQuestions: number[] | null } }
  | { type: 'setAnswers'; payload: { answers: AnswersMap } }
  | { type: 'replace'; payload: QuizLocalStoragePayload }
  | { type: 'setFinished'; payload: { isFinished: boolean } }
  | { type: 'clear' };

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'init':
      return action.payload;
    case 'updateAIQuestions':
  if (!state) return state;
      return {
        ...state,
        aiQuestions: action.payload.aiQuestions,
        selectedAIQuestions: action.payload.selectedAIQuestions,
      } as QuizState;
    case 'updateSelectedAIQuestions':
      return {
        ...state,
        selectedAIQuestions: action.payload.selectedAIQuestions,
      } as QuizState;
    case 'setAnswers': {
      if (!state || state.questions?.length === 0) return state;
      return { ...state, answers: action.payload.answers } as QuizState;
    }
    case 'replace':
      return { ...action.payload, isFinished: false } as QuizState;
    case 'setFinished':
      if (!state || state.questions?.length === 0) return state;
      return { ...state, isFinished: action.payload.isFinished } as QuizState;
    case 'clear':
      return null;
    default:
      return state;
  }
}

export default quizReducer;
