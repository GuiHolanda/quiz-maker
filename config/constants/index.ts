import { ExamsState } from '@/features/reducers/exams.reducer';
import { MockExamsState } from '@/features/reducers/mockExams.reducer';

export * from './generation-job';

export const EXAMS_URL = '/exam/exams';
export const SAVE_EXAM_URL = '/exam/save-exam';
export const SAVE_EXAM_QUESTIONS_URL = '/exam/save-questions';
export const EXAM_QUESTION_EXPLANATION_URL = '/exam/questions';
export const BROWSE_SUMMARY_URL = '/exam/browse-questions/summary';
export const BROWSE_QUESTIONS_URL = '/exam/browse-questions/questions';
export const PROVIDERS_URL = '/exam/providers';
export const EXAM_BOARDS_URL = '/exam/exam-boards';
export const EXTRACT_EDITAL_URL = '/exam/extract-from-edital';
export const AUTO_CONFIG_URL = '/exam/auto-config';
export const AUTO_CONFIG_IDENTIFY_URL = '/exam/auto-config/identify';
export const GENERATION_JOB_URL = '/generation-job';
export const USAGE_HISTORY_URL = '/usage/history';
export const USAGE_HISTORY_FILTERS_URL = '/usage/history/filters';
export const GENERATION_JOB_SAVE_URL = (jobId: string) => `/generation-job/${jobId}/save`;
export const CATALOG_URL = '/exam/catalog';
export const FORK_EXAM_URL = '/exam/fork-exam';
export const ADMIN_CATALOG_URL = '/admin/catalog';

export const DEMO_CATALOG_URL = '/marketing/demo/catalog';
export const DEMO_QUIZ_URL = '/marketing/demo/quiz';

// A demo exam must be able to fill one whole quiz, otherwise the catalog would
// advertise a certification the quiz cannot serve. The ceiling caps how much of
// the paid pool a public, unauthenticated demo can expose.
export const DEMO_SLICE_MIN = 10;
export const DEMO_SLICE_MAX = 30;
export const DEMO_QUIZ_SIZE = 10;

// Floor, not a format: the CFA Level I exam legitimately uses three choices.
// Per-exam fidelity to the real option count is enforced by the seed script.
export const DEMO_MIN_OPTIONS = 3;

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

// Pro/Pro AI quotas below are the "nova grade" from the pricing tier audit (weeks 4-6):
// lower per-period question count, higher exam count, break-even lands around 33%/40% of
// quota instead of 22%/26%. Subscribers who signed up under the old 1500/2500 quotas keep
// them via customQuotaOverride — see migration backfill_founder_quota_lock — so this only
// takes effect for new signups. The price shown on /pricing is unchanged until new Stripe
// Price objects exist for the higher amounts (R$29,90/R$49,90 in the audit's proposal);
// until then this is a quota-only adjustment at the current price.
// sprint mirrors pro_ai exactly — "tudo do Pro AI" for 90 days, one-time payment, no
// renewal. Access itself is time-boxed via User.sprintExpiresAt (see auth.ts), not by a
// lower quota here.
export const PLAN_LIMITS = {
  free: { questionsPerPeriod: 100, maxExams: 2, autoConfigPerPeriod: 0, canEditExams: false },
  pro: { questionsPerPeriod: 1000, maxExams: 6, autoConfigPerPeriod: 15, canEditExams: true },
  pro_ai: { questionsPerPeriod: 2000, maxExams: 12, autoConfigPerPeriod: 30, canEditExams: true },
  sprint: { questionsPerPeriod: 2000, maxExams: 12, autoConfigPerPeriod: 30, canEditExams: true },
  tester: { questionsPerPeriod: Infinity, maxExams: Infinity, autoConfigPerPeriod: Infinity, canEditExams: true },
  admin: { questionsPerPeriod: Infinity, maxExams: Infinity, autoConfigPerPeriod: Infinity, canEditExams: true },
} as const;

// Single source of truth for "can this plan create/edit exams" — API routes and UI walls
// both derive from PLAN_LIMITS instead of keeping a second list of plan names in sync.
export function canEditExams(plan: string): boolean {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  return limits ? limits.canEditExams : false;
}

export const ADMIN_USERS_URL = '/admin/users';
export const ADMIN_OVERVIEW_URL = '/admin/overview';
export const ADMIN_AUDIT_LOG_URL = '/admin/audit-log';
export const ADMIN_EXCHANGE_RATE_URL = '/admin/exchange-rate';

export const ACTIVE_MODEL_PRICING_USD = {
  inputPerMillion: 0.75,
  outputPerMillion: 4.5,
} as const;

export const USD_TO_BRL_FALLBACK = 5.7;

// sprint is a one-time R$89,90 payment for 90 days, not a recurring monthly charge — the
// value here is that spread over 3 months (89.90 / 3), purely so the admin margin table
// has a comparable monthly-equivalent figure. Real revenue timing is lumpy, not smooth.
export const PLAN_PRICES_BRL_MONTHLY: Record<string, number> = {
  free: 0,
  pro: 19.8,
  pro_ai: 39.8,
  sprint: 29.97,
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

export const SEARCH_URL = '/search';

export const DASHBOARD_STATS_URL = '/dashboard/stats';

export const AI_CHAT_ALLOWED_PLANS: string[] = ['pro_ai', 'sprint', 'tester', 'admin'];
