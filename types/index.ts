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

export interface Question {
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
  correctOptions: string[];
  explanations: Option;
}

export type QuizParams = {
  certificationTitle: string;
  topic: string;
  numQuestions: number;
  difficulty?: { easy: number; medium: number; hard: number };
  newPercent?: number;
  timeoutMs?: number;
};
export interface QuizPayload {
  meta: { topic: string; num_questions: number };
  questions: Question[];
  answers: AnswersMap;
  isFinished: boolean;
}

export interface Certification {
  label: string;
  key: string;
  topics: string[];
}


export interface QuizStoreApi {
  quiz: QuizState;
  setAnswers: (answers: AnswersMap) => void;
  replaceQuiz: (payload: QuizPayload) => void;
  setFinished: (isFinished: boolean) => void;
  clear: () => void;
}

export interface CertificationPayload{
  certifications: Certification[];
  selectedCertification: Certification | null;
}

export interface CertificationsStoreApi {
  certifications: Certification[];
  selectedCertification: Certification | null;
  setCertifications: (certifications: Certification[]) => void;
  setSelectedCertification: (certification: Certification | null) => void;
  addCertification: (certification: Certification) => void;
  removeCertification: (key: string) => void;
  updateCertification: (key: string, patch: Partial<Certification>) => void;
}
