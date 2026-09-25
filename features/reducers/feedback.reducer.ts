import type { QuestionReportSurface } from '@/config/constants';

export interface QuestionReportTarget {
  readonly examQuestionId: number;
  readonly surface: QuestionReportSurface;
  readonly mockExamAttemptId?: number;
}

export interface FeedbackState {
  readonly reportTarget: QuestionReportTarget | null;
  readonly isFeedbackOpen: boolean;
  readonly isBusy: boolean;
}

export type FeedbackAction =
  | { type: 'openQuestionReport'; payload: QuestionReportTarget }
  | { type: 'openFeedback' }
  | { type: 'submitStarted' }
  | { type: 'submitFailed' }
  | { type: 'submitSucceeded' }
  | { type: 'close' };

export const INITIAL_FEEDBACK_STATE: FeedbackState = {
  reportTarget: null,
  isFeedbackOpen: false,
  isBusy: false,
};

export function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  switch (action.type) {
    case 'openQuestionReport':
      return state.isBusy ? state : { reportTarget: action.payload, isFeedbackOpen: false, isBusy: false };
    case 'openFeedback':
      return state.isBusy ? state : { reportTarget: null, isFeedbackOpen: true, isBusy: false };
    case 'submitStarted':
      return state.reportTarget || state.isFeedbackOpen ? { ...state, isBusy: true } : state;
    case 'submitFailed':
      return { ...state, isBusy: false };
    case 'submitSucceeded':
      return INITIAL_FEEDBACK_STATE;
    case 'close':
      return state.isBusy ? state : INITIAL_FEEDBACK_STATE;
    default:
      return state;
  }
}
