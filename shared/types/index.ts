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

export type UserPlan = 'free' | 'pro' | 'admin';

export type QuotaAction = 'generate_questions' | 'create_certification';

export interface UsageStats {
  plan: UserPlan;
  questionsUsed: number;
  questionsLimit: number;
  certificationsUsed: number;
  certificationsLimit: number;
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
  score: number;
}

export interface MockExamResult {
  attempt: MockExamAttempt;
  mockExam: Pick<MockExam, 'id' | 'name' | 'publicExam'>;
  questions: MockExamQuestion[];
  subjectBreakdown: { subjectName: string; correct: number; total: number }[];
}
