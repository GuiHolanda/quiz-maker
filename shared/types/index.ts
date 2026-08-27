import type { QuizState } from '@/features/reducers/quiz.reducer';
import type { QuestionFormatKey } from '@/config/question-formats';

import { SVGProps } from 'react';

export type InputVariant = 'bordered' | 'flat' | 'faded' | 'underlined' | undefined;
export type InputLabelPlacement = 'outside' | 'outside-left' | 'outside-top' | 'inside' | undefined;
export type AnswersMap = Record<number, string[]>;
export type Option = Record<string, string>;
export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
export type QuizFormErrors = {
  certificationTitle?: string;
  topic?: string;
  num_questions?: string;
};

export interface AIQuestion {
  id: number;
  certificationTitle: string;
  text: string;
  correctCount: number;
  topic: string;
  difficulty: string;
  options: Option;
  topicSubarea?: string;
}

export interface StoredQuestion {
  id: number;
  certificationTitle: string;
  text: string;
  correctCount: number;
  topic: string;
  difficulty: string;
  options: Option;
  answer: Answer;
  topicSubarea?: string;
}

export interface Answer {
  questionId: number;
  correctOptions: string[];
  explanations: Record<string, string>;
}

export interface QuizLocalStoragePayload {
  meta: { topic: string; num_questions: number };
  aiQuestions: AIQuestion[];
  selectedAIQuestions: number[] | null;
  answers?: AnswersMap;
  isFinished?: boolean;
  questions?: StoredQuestion[];
}

export type ExamType = 'certification' | 'public_exam';

export interface Provider {
  readonly id?: string;
  readonly name: string;
  readonly fullName?: string | null;
  readonly logoUrl?: string | null;
}

export interface ExamTopic {
  readonly id?: string;
  readonly name: string;
}

export interface ExamSection {
  readonly id?: string;
  readonly name: string;
  readonly minQuestions: number; // 0–100 percent
  readonly maxQuestions: number; // 0–100 percent
  readonly topics?: ExamTopic[];
  readonly questions?: number;
}

export interface Exam {
  readonly id?: string;
  readonly type: ExamType;
  readonly name: string;
  readonly role?: string | null;
  readonly year?: number | null;
  readonly key?: string | null;
  readonly totalQuestions: number;
  readonly examDurationMinutes?: number | null;
  readonly passingScore?: number | null;
  readonly questionFormat?: QuestionFormatKey;
  readonly provider?: Provider | null;
  readonly examBoard?: ExamBoard | null;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly sections: ExamSection[];
}

export interface SectionUpdatePayload {
  sectionId: string;
  newName?: string;
  minQuestions: number;
  maxQuestions: number;
}

export interface QuizStoreApi {
  state: QuizState;
  setAIquestions: (aiQuestions: AIQuestion[], selectedAIQuestions: number[] | null) => void;
  setSelectedAIquestions: (selectedAIQuestions: number[] | null) => void;
  setAnswers: (answers: AnswersMap) => void;
  replaceQuiz: (payload: QuizLocalStoragePayload) => void;
  setFinished: (isFinished: boolean) => void;
  clear: () => void;
}

export interface ExamPayload {
  exams: Exam[];
  selectedExam: Exam | null;
}

export type Language = 'en' | 'pt';

export interface LanguageStoreApi {
  readonly language: Language;
  readonly messages: Record<string, string>;
  readonly setLanguage: (lang: Language) => void;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessage {
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly examDraft?: Exam;
  readonly sources?: string[];
  readonly isError?: boolean;
  readonly attachmentName?: string;
}

export type UserPlan = 'free' | 'pro' | 'pro_ai' | 'sprint' | 'tester' | 'admin';

export type QuotaAction =
  | 'generate_questions'
  | 'create_exam'
  | 'extract_edital'
  | 'ai_chat'
  | 'auto_config'
  | 'generate_explanation'
  | 'generate_mock_answers';

// Which limit a 403 refers to. `plan_required` is not a quota at all — the plan simply
// doesn't include the feature — but it travels the same path to the client, so the UI
// treats both as "blocked, here's the upgrade path".
export type QuotaLimitCode = 'questions_limit' | 'exam_limit' | 'auto_config_limit';

export type LimitCode = QuotaLimitCode | 'plan_required';

export interface UsageStats {
  plan: UserPlan;
  questionsUsed: number;
  questionsLimit: number;
  questionsSavedInLibrary: number;
  examsUsed: number; // enforcement: total across both types
  examsLimit: number; // -1 = unlimited
  certificationsUsed: number; // display only
  publicExamsUsed: number; // display only
  aiChatUsed: number; // messages sent this period
  aiChatLimit: number; // -1 = unlimited (tester/admin), 0 = plan doesn't include AI Chat
  periodStartDate: string;
  hasStripePortalAccess: boolean; // true only if user has a stripeCustomerId (not all paid plans do)
  sprintExpiresAt: string | null; // set only when plan === 'sprint'
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  referredCount: number;
  activatedCount: number;
  bonusQuestionsEarned: number;
}

export interface BrowseSectionSummary {
  name: string;
  questionCount: number;
}

export interface BrowseExamSummary {
  id: string;
  name: string;
  type: ExamType;
  referenceName: string; // provider.name (cert) or examBoard.name (concurso)
  totalCount: number;
  sections: BrowseSectionSummary[];
}

export interface BrowseSummary {
  exams: BrowseExamSummary[];
}

export interface BrowseQuestionsParams {
  examName: string;
  section: string;
  page: number;
  pageSize: number;
}

export interface BrowseQuestionsResponse {
  questions: StoredExamQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExamBoard {
  id?: string;
  name: string;
  fullName?: string | null;
  logoUrl?: string | null;
}

export interface AIExamQuestion {
  id: number;
  examName: string;
  sectionName: string;
  topic?: string;
  text: string;
  correctCount: number;
  difficulty: string;
  options: Option;
}

export interface StoredExamQuestion {
  id: number;
  examName: string;
  sectionName: string;
  topic?: string;
  text: string;
  correctCount: number;
  difficulty: string;
  options: Option;
  answer: Answer;
}

export interface ExamQuestionParams {
  exam_name: string;
  reference_name: string; // provider.name (cert) or examBoard.name (concurso)
  section_name: string;
  topic_name?: string;
  num_questions: string;
}

export type SearchResultType = 'question' | 'certification' | 'publicExam' | 'topic' | 'simulado';

export interface SearchResultItem {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly href: string;
  readonly type: SearchResultType;
}

export interface SearchResponse {
  readonly results: SearchResultItem[];
}

export interface ExamRef {
  id: string;
  name: string;
  type: ExamType;
  provider?: Provider | null;
  examBoard?: ExamBoard | null;
}

export interface MockExamSectionConfig {
  sectionName: string;
  questionCount: number;
}

export type MockExamQuestionSource = 'library' | 'unseen' | 'wrong';

export interface MockExamQuestion {
  id: number;
  order: number;
  examQuestion: StoredExamQuestion;
}

export interface MockExamAttemptAnswer {
  mockExamQuestionId: number;
  selectedOptions: string[];
}

export interface MockExamAttempt {
  id: number;
  mockExamId: number;
  startedAt: string;
  finishedAt: string | null;
  score: number | null;
  timedOut: boolean;
  answers: MockExamAttemptAnswer[];
}

export interface MockExam {
  id: number;
  name: string | null;
  examId: string;
  exam: ExamRef;
  sections: MockExamSectionConfig[];
  questions: MockExamQuestion[];
  attempts: MockExamAttempt[];
  durationMinutes: number | null;
  questionSource: MockExamQuestionSource;
  passingScorePercent: number | null;
  createdAt: string;
}

export interface MockExamListItem {
  id: number;
  name: string | null;
  exam: ExamRef;
  totalQuestions: number;
  attemptCount: number;
  bestScore: number | null;
  lastAttemptId: number | null;
  openAttemptId: number | null;
  attempts: Pick<MockExamAttempt, 'id' | 'score' | 'startedAt' | 'finishedAt' | 'timedOut'>[];
  durationMinutes: number | null;
  questionSource: MockExamQuestionSource;
  passingScorePercent: number | null;
  createdAt: string;
}

export interface CreateMockExamPayload {
  examId: string;
  name?: string;
  totalQuestions: number;
  sections: MockExamSectionConfig[];
  questionSource?: MockExamQuestionSource;
  durationMinutes?: number | null;
}

export interface FinishAttemptPayload {
  answers: MockExamAttemptAnswer[];
}

export interface MockExamSectionResult {
  sectionName: string;
  correct: number;
  total: number;
  weightPercent: number;
  previousAvgPercent: number | null;
}

export interface MockExamResult {
  attempt: MockExamAttempt;
  mockExam: Pick<MockExam, 'id' | 'name' | 'exam'>;
  questions: MockExamQuestion[];
  sectionBreakdown: MockExamSectionResult[];
  examMeta: {
    passingScorePercent: number | null;
    durationMinutes: number | null;
  };
  attemptNumber: number;
  totalAttempts: number;
  overallPreviousAvgPercent: number | null;
}

export interface UserAdminRow {
  id: string;
  name: string | null;
  email: string;
  plan: UserPlan;
  customQuotaOverride: number | null;
  questionsGeneratedThisPeriod: number;
  periodStartDate: string;
  subscriptionStatus: string | null;
  createdAt: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalQuestionsGeneratedAllTime: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export interface AdminStepStats {
  inputTokens: number;
  outputTokens: number;
  count: number;
  avgDurationMs: number;
}

export interface AdminActionStats {
  inputTokens: number;
  outputTokens: number;
  count: number;
  avgDurationMs: number;
  steps: Record<string, AdminStepStats>;
}

export interface AdminOverviewStats {
  totalUsers: number;
  byPlan: Record<UserPlan, number>;
  activeSubscriptions: number;
  totalQuestionsGenerated: number;
  avgUsagePercent: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgTokensPerQuestion: number;
  tokensByPlan: Record<UserPlan, { inputTokens: number; outputTokens: number; questionsGenerated: number }>;
  tokensByAction: Record<string, AdminActionStats>;
  usagePercentilesByPlan: Record<UserPlan, { count: number; p50: number; p75: number; p90: number }>;
}

export interface AdminAuditEntry {
  id: string;
  adminId: string;
  adminName: string | null;
  adminEmail: string;
  targetId: string;
  targetName: string | null;
  targetEmail: string;
  action: string;
  before: string;
  after: string;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: UserAdminRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminAuditLogResponse {
  entries: AdminAuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

// Generic interface for SimuladoQuestionList (both domains)
export interface SimuladoQuestion {
  readonly id: number;
  readonly simuladoQuestionId: number;
  readonly text: string;
  readonly correctCount: number;
  readonly options: Record<string, string>;
}

export interface UnifiedQuestion {
  id: number;
  type: 'certification' | 'public_exam';
  text: string;
  difficulty: string;
  topic: string;
  sourceLabel: string;
  options: Record<string, string>;
  answer: {
    correctOptions: string[];
    explanations: Record<string, string>;
  } | null;
  createdAt: string;
  correctCount: number;
}

export interface QuestionBankParams {
  type?: 'certification' | 'public_exam' | 'all';
  search?: string;
  source?: string[];
  topic?: string[];
  difficulty?: string[];
  hasAnswer?: boolean;
  hasExplanation?: boolean;
  sort?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface QuestionBankResponse {
  questions: UnifiedQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  createdAt: string;
  read: boolean;
}

export interface GenerationJobTopicStatus {
  id: string;
  topicName: string;
  questionCount: number;
  status: 'queued' | 'running' | 'done' | 'error' | 'cancelled';
  savedCount: number;
  errorMessage: string | null;
  errorType: 'quota' | 'generation' | 'timeout' | null;
}

export interface GenerationJobStatus {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error' | 'awaiting_review';
  totalTopics: number;
  doneTopics: number;
  queuedTopics: number;
  savedCount: number;
  type: 'certification' | 'public_exam';
  refKey: string;
  refName: string;
  examBoardName: string | null;
  topics: GenerationJobTopicStatus[];
}

export interface AutoConfigMatch {
  readonly label: string;
  readonly key: string | null;
  readonly provider: string | null;
  readonly examBoard: string | null;
  readonly role: string | null;
  readonly roles: string[];
  readonly year: number | null;
}

export interface AutoConfigIdentifyResult {
  readonly matches: AutoConfigMatch[];
  readonly clarification: string | null;
}

export type EditalDocumentKind = 'main' | 'annex' | 'unknown';

export type EditalDomainClass = 'official-org' | 'official-banca' | 'aggregator' | 'other';
export interface EditalCandidate {
  readonly url: string;
  readonly editalNumber: string | null;
  readonly year: number | null;
  readonly orgao: string | null;
  readonly isOfficialDomain: boolean;
  readonly coversRole: boolean;
  readonly documentKind: EditalDocumentKind;
  readonly domainClass: EditalDomainClass;
  readonly verification: EditalVerification;
}

export type EditalVerification = 'confirmed' | 'annex' | 'unreadable' | 'unchecked';

export interface LocateEditalResult {
  readonly editais: EditalCandidate[];
  readonly targetYearFound: boolean;
  readonly confirmedFound: boolean;
}

export type BlueprintConfidence = 'official' | 'prior-year' | 'estimated';

export type AutoConfigStage = 'research' | 'review' | 'format' | 'extract';

export interface AutoConfigJobStatus {
  readonly id: string;
  readonly type: ExamType;
  readonly seedName: string;
  readonly seedProvider: string | null;
  readonly status: 'queued' | 'running' | 'done' | 'error' | 'cancelled';
  readonly stage: AutoConfigStage | null;
  readonly errorMessage: string | null;
  readonly errorType: 'quota' | 'generation' | 'timeout' | null;
  readonly resultJson: string | null;
}

export interface GenerationHistoryItem {
  id: string;
  source: 'usage_log' | 'generation_job';
  type: 'individual' | 'full_exam';
  domain: 'certification' | 'public_exam';
  refName: string | null;
  refRole: string | null;
  topicName: string | null;
  questionsGenerated: number;
  questionsSaved: number;
  status: 'done' | 'error' | 'awaiting_review' | 'cancelled' | 'running' | 'queued';
  createdAt: string;
}

export interface GenerationHistoryResponse {
  items: GenerationHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface GenerationHistoryFilters {
  readonly domain: 'all' | 'certification' | 'public_exam';
  readonly source: string[];
  readonly topic: string[];
  readonly status: string[];
  readonly sort: 'asc' | 'desc';
}

export const EMPTY_HISTORY_FILTERS: GenerationHistoryFilters = {
  domain: 'all',
  source: [],
  topic: [],
  status: [],
  sort: 'desc',
};

export interface GenerationHistoryFilterOptions {
  sources: string[];
  topics: string[];
}

export interface DashboardRecentSession {
  readonly simuladoName: string;
  readonly examName: string;
  readonly score: number;
  readonly totalQuestions: number;
  readonly durationMs: number;
  readonly finishedAt: string;
}

export interface DashboardScoreTrendPoint {
  readonly score: number;
  readonly finishedAt: string;
}

export interface DashboardDomainStat {
  readonly sectionName: string;
  readonly avgScore: number;
  readonly totalAttempts: number;
}

export interface DashboardStats {
  readonly totalSimuladosCompleted: number;
  readonly bestScore: number | null;
  readonly recentSessions: DashboardRecentSession[];
  readonly scoreTrend: DashboardScoreTrendPoint[];
  readonly domainBreakdown: DashboardDomainStat[];
}

export interface CatalogExam {
  readonly id: string;
  readonly type: ExamType;
  readonly name: string;
  readonly role?: string | null;
  readonly year?: number | null;
  readonly key?: string | null;
  readonly totalQuestions: number;
  readonly examDurationMinutes?: number | null;
  readonly passingScore?: number | null;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly provider?: Provider | null;
  readonly examBoard?: ExamBoard | null;
  readonly sections: ExamSection[];
  readonly poolQuestionCount: number;
  readonly isSubscribed: boolean;
}

export interface CatalogListResponse {
  readonly templates: CatalogExam[];
}

export interface AdminCatalogEntry {
  readonly id: string;
  readonly type: ExamType;
  readonly name: string;
  readonly role?: string | null;
  readonly year?: number | null;
  readonly provider?: Provider | null;
  readonly examBoard?: ExamBoard | null;
  readonly isTemplate: boolean;
  readonly userId: string | null;
  readonly ownerEmail?: string | null;
  readonly sectionCount: number;
  readonly questionCount: number;
}

export interface AdminCatalogListResponse {
  readonly entries: AdminCatalogEntry[];
}

export interface AdminCatalogExamDetail {
  readonly id: string;
  readonly type: ExamType;
  readonly name: string;
  readonly role?: string | null;
  readonly year?: number | null;
  readonly key?: string | null;
  readonly totalQuestions?: number | null;
  readonly examDurationMinutes?: number | null;
  readonly passingScore?: number | null;
  readonly isTemplate: boolean;
  readonly ownerEmail?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly provider?: Provider | null;
  readonly examBoard?: ExamBoard | null;
  readonly sections: ExamSection[];
  readonly questionCount: number;
  readonly poolQuestionCount: number;
}

// ─── Demo Quiz (marketing landing pages) ─────────────────────────────────
export interface DemoQuestion {
  readonly text: string;
  readonly options: readonly string[];
  readonly correctIndexes: readonly number[];
  readonly topic: string;
  readonly explanation: string;
}

export interface DemoCatalogDomain {
  readonly name: string;
  readonly weight: number;
  readonly available: number;
}

export interface DemoCatalogExam {
  readonly id: string;
  readonly name: string;
  readonly mark: string;
  readonly vendor: string;
  readonly logoUrl: string | null;
  readonly year: string;
  readonly questions: number;
  readonly minutes: number;
  readonly passing: string;
  readonly updatedAt: string;
  readonly poolSize: number;
  readonly domains: readonly DemoCatalogDomain[];
}

export interface DemoCatalogResponse {
  readonly exams: readonly DemoCatalogExam[];
}

export interface DemoQuizResponse {
  readonly questions: readonly DemoQuestion[];
}

// ─── Exam Landing Pages ───────────────────────────────────────────────────
export interface ExamLandingFaq {
  readonly question: string;
  readonly answer: string;
}

export interface ExamLandingTopic {
  readonly name: string;
  readonly weight: number;
}
export interface ExamLandingSampleQuestion {
  readonly topic: string;
  readonly stem: string;
  readonly options: readonly string[];
  readonly answerIndex: number;
  readonly explanation: string;
}

export interface ExamLandingConfig {
  readonly slug: string;
  readonly name: string; // short display name, e.g. "CEA"
  readonly fullName: string; // full certification name
  readonly provider: string; // e.g. "ANBIMA", "Amazon Web Services"
  readonly demoExamName?: string;
  readonly examType: ExamType;
  readonly totalQuestions: number;
  readonly examDurationMinutes: number;
  readonly passingScore: number; // percentage, e.g. 70
  readonly topics: readonly ExamLandingTopic[];
  readonly sampleQuestions: readonly ExamLandingSampleQuestion[];
  readonly heroHeadline: string;
  readonly heroSubheadline: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly faqs: readonly ExamLandingFaq[];
}
