import { ExamsState } from '@/features/reducers/exams.reducer';
import { MockExamsState } from '@/features/reducers/mockExams.reducer';

export * from './generation-job';

export const EXAMS_URL = '/exam/exams';
export const SAVE_EXAM_URL = '/exam/save-exam';
export const SAVE_EXAM_QUESTIONS_URL = '/exam/save-questions';
export const GET_EXAM_ANSWERS_URL = '/exam/get-answers';
export const EXAM_QUIZ_GENERATOR_URL = '/exam/quiz-generator';
export const EXAM_QUESTION_EXPLANATION_URL = '/exam/questions';
export const BROWSE_SUMMARY_URL = '/exam/browse-questions/summary';
export const BROWSE_QUESTIONS_URL = '/exam/browse-questions/questions';
export const PROVIDERS_URL = '/exam/providers';
export const EXAM_BOARDS_URL = '/exam/exam-boards';
export const EXTRACT_EDITAL_URL = '/exam/extract-from-edital';
export const GENERATION_JOB_URL = '/generation-job';
export const USAGE_HISTORY_URL = '/usage/history';
export const USAGE_HISTORY_FILTERS_URL = '/usage/history/filters';
export const GENERATION_JOB_SAVE_URL = (jobId: string) => `/generation-job/${jobId}/save`;

export const QUIZ_LOCAL_STORAGE_KEY = 'QUIZ';
export const EXAMS_LOCAL_STORAGE_KEY = 'EXAMS';
export const LANGUAGE_LOCAL_STORAGE_KEY = 'app-language';
export const SIDEBAR_COLLAPSED_LOCAL_STORAGE_KEY = 'certifiqueai_sidebar_collapsed';
export const SIDEBAR_COLLAPSED_COOKIE_KEY = 'certifiqueai_sidebar_collapsed';
export const AI_CHAT_LOCAL_STORAGE_KEY = (userId: string) => `AI_CHAT_MESSAGES_${userId}`;
export const AI_CHAT_FOLLOWUP_TIMESTAMP_KEY = (userId: string) => `AI_CHAT_FOLLOWUP_TS_${userId}`;
export const SIMULADO_ATTEMPT_PROGRESS_KEY = (attemptId: number) => `SIMULADO_ATTEMPT_PROGRESS_${attemptId}`;
export const APP_NOTIFICATIONS_LOCAL_STORAGE_KEY = 'APP_NOTIFICATIONS';
export const SIMULADO_NEW_PREFILL_KEY = 'SIMULADO_NEW_PREFILL';
export const AI_CHAT_INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
// Auto-logout after 30 minutes of no mouse/keyboard/touch activity while chat is open
export const AI_CHAT_LOGOUT_INACTIVITY_MS = 30 * 60 * 1000;
export const QUESTIONS_PER_PAGE_OPTIONS = [
  { key: '1', label: '1' },
  { key: '5', label: '5' },
  { key: '10', label: '10' },
  { key: '20', label: '20' },
];

export const INITIAL_EXAMS_STATE: ExamsState = {
  exams: [],
  selectedExam: null,
  selectedSections: [],
  selectedTopic: null,
  isLoading: true,
};

export const REGISTER_URL = '/auth/register';
export const FORGOT_PASSWORD_URL = '/auth/forgot-password';
export const RESET_PASSWORD_URL = '/auth/reset-password';

export const BILLING_USAGE_URL = '/billing/usage';
export const BILLING_CHECKOUT_URL = '/billing/checkout';
export const BILLING_PORTAL_URL = '/billing/portal';

export const PLAN_LIMITS = {
  free: { questionsPerPeriod: 250, maxExams: 2 },
  pro: { questionsPerPeriod: 1500, maxExams: 5 },
  pro_ai: { questionsPerPeriod: 2500, maxExams: 5 },
  tester: { questionsPerPeriod: Infinity, maxExams: Infinity },
  admin: { questionsPerPeriod: Infinity, maxExams: Infinity },
} as const;

export const ADMIN_USERS_URL = '/admin/users';
export const ADMIN_OVERVIEW_URL = '/admin/overview';
export const ADMIN_AUDIT_LOG_URL = '/admin/audit-log';
export const ADMIN_EXCHANGE_RATE_URL = '/admin/exchange-rate';

export const ACTIVE_MODEL_PRICING_USD = {
  inputPerMillion: 0.75,
  outputPerMillion: 4.5,
} as const;

export const USD_TO_BRL_FALLBACK = 5.7;

export const PLAN_PRICES_BRL_MONTHLY: Record<string, number> = {
  free: 0,
  pro: 19.8,
  pro_ai: 39.8,
};

export const MOCK_EXAMS_URL = '/mock-exams';
export const MOCK_EXAMS_LOCAL_STORAGE_KEY = 'MOCK_EXAMS';

export const INITIAL_MOCK_EXAMS_STATE: MockExamsState = {
  mockExams: [],
  isLoading: true,
};

export const QUESTION_BANK_URL = '/question-bank';
export const QUESTION_BANK_TOPICS_URL = '/question-bank/topics';
export const QUESTION_BANK_SOURCES_URL = '/question-bank/sources';

export const AI_CHAT_ALLOWED_PLANS: string[] = ['pro_ai', 'tester', 'admin'];
