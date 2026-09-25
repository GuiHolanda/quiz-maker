export const FEEDBACK_URL = '/feedback';
export const QUESTION_REPORT_URL = '/feedback/question-report';

export const QUESTION_REPORT_REASONS = [
  { id: 'wrong_answer_key', labelKey: 'feedback.reasonWrongAnswerKey' },
  { id: 'ambiguous_statement', labelKey: 'feedback.reasonAmbiguousStatement' },
  { id: 'out_of_scope', labelKey: 'feedback.reasonOutOfScope' },
  { id: 'typo', labelKey: 'feedback.reasonTypo' },
  { id: 'duplicate_options', labelKey: 'feedback.reasonDuplicateOptions' },
  { id: 'other', labelKey: 'feedback.reasonOther' },
] as const;

export type QuestionReportReason = (typeof QUESTION_REPORT_REASONS)[number]['id'];

export const QUESTION_REPORT_SURFACES = ['question_bank', 'attempt', 'review'] as const;

export type QuestionReportSurface = (typeof QUESTION_REPORT_SURFACES)[number];

export const QUESTION_REPORT_STATUSES = ['open', 'triaged', 'accepted', 'rejected', 'fixed'] as const;

export type QuestionReportStatus = (typeof QUESTION_REPORT_STATUSES)[number];

export const QUESTION_REPORT_TERMINAL_STATUSES = ['rejected', 'fixed'] as const;

export const QUESTION_REPORT_COMMENT_MAX_LENGTH = 1000;

export const FEEDBACK_CATEGORIES = [
  { id: 'bug', labelKey: 'feedback.categoryBug' },
  { id: 'suggestion', labelKey: 'feedback.categorySuggestion' },
  { id: 'praise', labelKey: 'feedback.categoryPraise' },
  { id: 'question', labelKey: 'feedback.categoryQuestion' },
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]['id'];
