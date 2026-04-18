import { SVGProps } from 'react';
import type { QuizState } from '@/features/reducers/quiz.reducer';

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
