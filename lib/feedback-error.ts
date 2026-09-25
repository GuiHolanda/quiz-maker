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
