import { SVGProps } from 'react';
import type { QuizState } from '@/features/reducers/quiz.reducer';


export type InputVariant = "bordered" | "flat" | "faded" | "underlined" | undefined;
export type InputLabelPlacement = "outside" | "outside-left" | "outside-top" | "inside" | undefined;
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
name: string;
maxQuestions: number;
minQuestions: number;
questions?: number;
}

export interface TopicUpdatePayload {
  certificationKey: string;
  topicName: string;
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
}

export type UserPlan = 'free' | 'pro';

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
