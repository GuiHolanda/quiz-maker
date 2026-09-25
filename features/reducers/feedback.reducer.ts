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

export type FeedbackErrorKind = 'question_report' | 'feedback';

export interface FeedbackErrorMessage {
  readonly titleKey: string;
  readonly descriptionKey: string;
}

interface HttpErrorShape {
  readonly response?: {
    readonly status?: number;
    readonly data?: { readonly code?: unknown };
  };
}

const RATE_LIMITED: FeedbackErrorMessage = {
  titleKey: 'feedback.rateLimitedTitle',
  descriptionKey: 'feedback.rateLimitedDescription',
};

const ALREADY_REPORTED: FeedbackErrorMessage = {
  titleKey: 'feedback.alreadyReportedTitle',
  descriptionKey: 'feedback.alreadyReportedDescription',
};

const GENERIC_BY_KIND: Record<FeedbackErrorKind, FeedbackErrorMessage> = {
  question_report: {
    titleKey: 'feedback.reportErrorTitle',
    descriptionKey: 'feedback.reportErrorDescription',
  },
  feedback: {
    titleKey: 'feedback.sendErrorTitle',
    descriptionKey: 'feedback.sendErrorDescription',
  },
};

export function resolveFeedbackError(err: unknown, kind: FeedbackErrorKind): FeedbackErrorMessage {
  const response = (err as HttpErrorShape | null | undefined)?.response;
  const status = response?.status;
  const code = response?.data?.code;

  if (code === 'rate_limited' || status === 429) return RATE_LIMITED;

  if (kind === 'question_report' && code === 'already_reported') return ALREADY_REPORTED;

  return GENERIC_BY_KIND[kind];
}
