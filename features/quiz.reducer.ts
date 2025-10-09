import type { AnswersMap, QuizPayload } from '@/types';

export type State = Readonly<QuizPayload> | null;

export type Action =
  | { type: 'init'; payload: QuizPayload }
  | { type: 'setAnswers'; payload: { answers: AnswersMap } }
  | { type: 'replace'; payload: QuizPayload }
  | { type: 'setFinished'; payload: { isFinished: boolean } }
  | { type: 'clear' };

export function quizReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'init':
      return action.payload;
    case 'setAnswers': {
      if (!state || state.questions.length === 0) return state;
      return { ...state, answers: action.payload.answers} as State;
    }
    case 'replace':
      return { ...action.payload, isFinished: false } as State;
    case 'setFinished':
      if (!state || state.questions.length === 0) return state;
      return { ...state, isFinished: action.payload.isFinished } as State;
    case 'clear':
      return null;
    default:
      return state;
  }
}

export default quizReducer;
