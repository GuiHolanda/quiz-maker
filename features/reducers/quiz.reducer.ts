import type { AnswersMap, QuizPayload } from '@/types';

export type QuizState = Readonly<QuizPayload> | null;

export type QuizAction =
  | { type: 'init'; payload: QuizPayload }
  | { type: 'setAnswers'; payload: { answers: AnswersMap } }
  | { type: 'replace'; payload: QuizPayload }
  | { type: 'setFinished'; payload: { isFinished: boolean } }
  | { type: 'clear' };

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'init':
      return action.payload;
    case 'setAnswers': {
      if (!state || state.questions.length === 0) return state;
      return { ...state, answers: action.payload.answers } as QuizState;
    }
    case 'replace':
      return { ...action.payload, isFinished: false } as QuizState;
    case 'setFinished':
      if (!state || state.questions.length === 0) return state;
      return { ...state, isFinished: action.payload.isFinished } as QuizState;
    case 'clear':
      return null;
    default:
      return state;
  }
}

export default quizReducer;
