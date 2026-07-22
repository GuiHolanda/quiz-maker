import type { QuizState } from '@/features/reducers/quiz.reducer';

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

export interface QuestionParams {
  certification_name: string;
  topic_name: string;
  num_questions: string;
}

export type QuizParams = {
  certificationTitle: string;
  topics: string[];
  numQuestions: number;
  difficulty?: { easy: number; medium: number; hard: number };
  newPercent?: number;
  timeoutMs?: number;
};
export interface QuizLocalStoragePayload {
  meta: { topic: string; num_questions: number };
  aiQuestions: AIQuestion[];
  selectedAIQuestions: number[] | null;
  answers?: AnswersMap;
  isFinished?: boolean;
  questions?: StoredQuestion[];
}

export interface AIQuestionsStoragePayload {
  meta: { topic: string; num_questions: number };
  questions: AIQuestion[];
  selectedAIQuestions: number[] | null;
}

export interface Certification {
  label: string;
  key: string;
  provider?: string;
  totalQuestions: number;
  examDurationMinutes?: number;
  passingScore?: number;
  createdAt?: string;
  updatedAt?: string;
  topics: CertificationTopic[];
}

export interface CertificationTopic {
  id?: string;
  name: string;
  maxQuestions: number;
  minQuestions: number;
  questions?: number;
}

export interface TopicUpdatePayload {
  topicId: string;
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

export interface CertificationPayload {
  certifications: Certification[];
  selectedCertification: Certification | null;
}

export interface CertificationsStoreApi {
  certifications: Certification[];
  selectedCertification: Certification | null;
  selectedTopics: string[];
  isLoading: boolean;
  setCertifications: (certifications: Certification[]) => void;
  setSelectedCertification: (certification: Certification | null) => void;
  setSelectedTopics: (topics: string[]) => void;
  addCertification: (certification: Certification) => void;
  removeCertification: (key: string) => void;
  updateCertification: (key: string, patch: Partial<Certification>) => void;
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
  readonly certificationData?: Certification;
  readonly sources?: string[];
  readonly isError?: boolean;
  readonly examDraft?: PublicExam;
  readonly attachmentName?: string;
}

export type UserPlan = 'free' | 'pro' | 'pro_ai' | 'tester' | 'admin';

export type QuotaAction = 'generate_questions' | 'create_certification' | 'create_public_exam';

export interface UsageStats {
  plan: UserPlan;
  questionsUsed: number;
  questionsLimit: number;
  questionsSavedInLibrary: number;
  certificationsUsed: number;
  certificationsLimit: number;
  publicExamsUsed: number;
  publicExamsLimit: number;
  periodStartDate: string;
}

export interface QuotaError {
  error: 'quota_exceeded';
  message: string;
  limit: number;
  used: number;
  plan: UserPlan;
}

export interface BrowseTopicSummary {
  name: string;
  questionCount: number;
}

export interface BrowseCertificationSummary {
  label: string;
  key: string;
  totalCount: number;
  topics: BrowseTopicSummary[];
}

export interface BrowseSummary {
  certifications: BrowseCertificationSummary[];
}

export interface BrowseQuestionsParams {
  certificationTitle: string;
  topic: string;
  page: number;
  pageSize: number;
}

export interface BrowseQuestionsResponse {
  questions: StoredQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExamBoard {
  id?: string;
  name: string;
  fullName?: string;
}

export interface PublicExamTopic {
  id?: string;
  name: string;
}

export interface PublicExamSubject {
  id?: string;
  name: string;
  minQuestions: number;
  maxQuestions: number;
  topics?: PublicExamTopic[];
  questions?: number;
}

export interface PublicExam {
  id?: string;
  name: string;
  role?: string;
  year?: number;
  totalQuestions: number;
  examDurationMinutes?: number;
  passingScore?: number;
  createdAt?: string;
  updatedAt?: string;
  examBoard: ExamBoard;
  subjects: PublicExamSubject[];
}

export interface AIPublicExamQuestion {
  id: number;
  publicExamName: string;
  examBoardName: string;
  subject: string;
  topic?: string;
  text: string;
  correctCount: number;
  difficulty: string;
  options: Option;
}

export interface StoredPublicExamQuestion {
  id: number;
  publicExamName: string;
  examBoardName: string;
  subject: string;
  topic?: string;
  text: string;
  correctCount: number;
  difficulty: string;
  options: Option;
  answer: Answer;
}

export interface PublicExamQuestionParams {
  public_exam_name: string;
  exam_board_name: string;
  subject_name: string;
  topic_name?: string;
  num_questions: string;
}

export interface PublicExamSubjectUpdatePayload {
  subjectId: string;
  newName?: string;
  minQuestions: number;
  maxQuestions: number;
}

export interface PublicExamPayload {
  publicExams: PublicExam[];
  selectedPublicExam: PublicExam | null;
}

export interface PublicExamsStoreApi {
  publicExams: PublicExam[];
  selectedPublicExam: PublicExam | null;
  selectedSubjects: string[];
  selectedTopic: string | null;
  isLoading: boolean;
  setPublicExams: (publicExams: PublicExam[]) => void;
  setSelectedPublicExam: (publicExam: PublicExam | null) => void;
  setSelectedSubjects: (subjects: string[]) => void;
  setSelectedTopic: (topic: string | null) => void;
  addPublicExam: (publicExam: PublicExam) => void;
  removePublicExam: (id: string) => void;
  updatePublicExam: (id: string, patch: Partial<PublicExam>) => void;
}

export interface BrowsePublicExamSubjectSummary {
  name: string;
  questionCount: number;
}

export interface BrowsePublicExamSummary {
  id: string;
  name: string;
  examBoardName: string;
  totalCount: number;
  subjects: BrowsePublicExamSubjectSummary[];
}

export interface PublicExamBrowseSummary {
  publicExams: BrowsePublicExamSummary[];
}

export interface PublicExamBrowseQuestionsParams {
  publicExamName: string;
  subject: string;
  page: number;
  pageSize: number;
}

export interface PublicExamBrowseQuestionsResponse {
  questions: StoredPublicExamQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export type PublicExamFormErrors = {
  publicExamName?: string;
  subject?: string;
  num_questions?: string;
};

export interface MockExamSubjectConfig {
  subjectName: string;
  questionCount: number;
}

export interface MockExamQuestion {
  id: number;
  order: number;
  publicExamQuestion: StoredPublicExamQuestion;
}

export interface MockExam {
  id: number;
  name: string | null;
  publicExamId: string;
  publicExam: Pick<PublicExam, 'id' | 'name' | 'examBoard'>;
  subjects: MockExamSubjectConfig[];
  questions: MockExamQuestion[];
  attempts: MockExamAttempt[];
  createdAt: string;
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
  answers: MockExamAttemptAnswer[];
}

export interface MockExamListItem {
  id: number;
  name: string | null;
  publicExam: Pick<PublicExam, 'id' | 'name' | 'examBoard'>;
  totalQuestions: number;
  attemptCount: number;
  bestScore: number | null;
  lastAttemptId: number | null;
  openAttemptId: number | null;
  attempts: Pick<MockExamAttempt, 'id' | 'score' | 'startedAt' | 'finishedAt'>[];
  createdAt: string;
}

export interface CreateMockExamPayload {
  publicExamId: string;
  name?: string;
  totalQuestions: number;
  subjects: MockExamSubjectConfig[];
}

export interface FinishAttemptPayload {
  answers: MockExamAttemptAnswer[];
}

export interface MockExamResult {
  attempt: MockExamAttempt;
  mockExam: Pick<MockExam, 'id' | 'name' | 'publicExam'>;
  questions: MockExamQuestion[];
  subjectBreakdown: { subjectName: string; correct: number; total: number }[];
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

// Generic interfaces for SimuladoQuestionList and ResultQuestionCard (both domains)
export interface SimuladoQuestion {
  readonly id: number;
  readonly simuladoQuestionId: number;
  readonly text: string;
  readonly correctCount: number;
  readonly options: Record<string, string>;
}

export interface SimuladoResultQuestion {
  readonly id: number;
  readonly simuladoQuestionId: number;
  readonly order: number;
  readonly groupLabel: string;
  readonly text: string;
  readonly correctCount: number;
  readonly options: Record<string, string>;
  readonly answer: { correctOptions: string[] } | null;
}

// Certification Simulado types
export interface CertSimuladoTopicConfig {
  topicName: string;
  questionCount: number;
}

export interface CertSimuladoQuestion {
  id: number;
  order: number;
  question: StoredQuestion;
}

export interface CertSimuladoAttemptAnswer {
  simuladoQuestionId: number;
  selectedOptions: string[];
}

export interface CertSimuladoAttempt {
  id: number;
  simuladoId: number;
  startedAt: string;
  finishedAt: string | null;
  score: number | null;
  answers: CertSimuladoAttemptAnswer[];
}

export interface CertSimuladoListItem {
  id: number;
  name: string | null;
  certKey: string;
  certLabel: string;
  totalQuestions: number;
  attemptCount: number;
  bestScore: number | null;
  lastAttemptId: number | null;
  openAttemptId: number | null;
  attempts: Pick<CertSimuladoAttempt, 'id' | 'score' | 'startedAt' | 'finishedAt'>[];
  createdAt: string;
}

export interface CertSimulado {
  id: number;
  name: string | null;
  certKey: string;
  certLabel: string;
  topics: CertSimuladoTopicConfig[];
  questions: CertSimuladoQuestion[];
}

export interface CreateCertSimuladoPayload {
  certKey: string;
  name?: string;
  topics: CertSimuladoTopicConfig[];
}

export interface CertFinishAttemptPayload {
  answers: CertSimuladoAttemptAnswer[];
}

export interface CertSimuladoResult {
  attempt: CertSimuladoAttempt;
  simulado: Pick<CertSimulado, 'id' | 'name' | 'certKey' | 'certLabel'>;
  questions: CertSimuladoQuestion[];
  topicBreakdown: { topicName: string; correct: number; total: number }[];
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
}

export interface QuestionBankParams {
  type?: 'certification' | 'public_exam' | 'all';
  search?: string;
  source?: string[];
  topic?: string[];
  difficulty?: string[];
  hasAnswer?: boolean;
  hasExplanation?: boolean;
  page: number;
  pageSize: number;
}

export interface QuestionBankResponse {
  questions: UnifiedQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export type SimuladoType = 'certification' | 'concurso';
