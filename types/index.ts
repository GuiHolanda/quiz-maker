import { quizReducer } from '@/features/reducers/quiz.reducer';
import { SVGProps } from 'react';

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
  explanations: Option[];
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
  topics?: string[];
}

export type Certifications = Certification[];

export interface QuizStoreApi {
  quiz: ReturnType<typeof quizReducer>;
  setAnswers: (answers: AnswersMap) => void;
  replaceQuiz: (payload: QuizPayload) => void;
  setFinished: (isFinished: boolean) => void;
  clear: () => void;
}

export interface CertificationsStoreApi {
  certifications: Certifications;
  setCertifications: (certs: Certifications) => void;
  addCertification: (cert: Certification) => void;
  removeCertification: (key: string) => void;
  updateCertification: (key: string, patch: Partial<Certification>) => void;
}
