import { SVGProps } from "react";

export type AnswersMap = Record<number, string[]>;
export type Option = Record<string, string>;
export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// export type PromptParams = {
//   certificationTitle: string;
//   topic: string;
//   num_questions: string;
//   difficulty_distribution?: {
//     easy?: number;
//     medium?: number;
//     hard?: number;
//   };
// };

export type QuizFormErrors = {
  certificationTitle?: string;
  topic?: string;
  num_questions?: string;
};

export interface RequestBody {
  num_questions: number;
  topic: string;
  difficulty_distribution: { easy: number; medium: number; hard: number };
}

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
  difficulty: { easy: number; medium: number; hard: number };
  newPercent?: number;
  timeoutMs?: number;
};
export interface QuizPayload {
  meta: { topic: string; num_questions: number };
  questions: Question[];
  answers: AnswersMap;
  isFinished: boolean;
}