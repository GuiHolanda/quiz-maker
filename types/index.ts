import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface RequestBody {
  num_questions: number;
  topic: string;
  difficulty_distribution: { easy: number; medium: number; hard: number };
}

export type QuizForm = {
  topic: string;
  num_questions: string;
  difficulty_distribution?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
};

export type QuizFormErrors = {
  topic?: string;
  num_questions?: string;
};

export interface Questionare {
  questions: Question[];
  answers: Answer[];
}

export interface Question {
  id: number;
  text: string;
  correctCount: number;
  topic: string;
  difficulty: string;
  options: Option;
  answer: Answer;
  topicSubarea?: string;
}

// export interface Option {
//   label: string;
//   text: string;
// }

export interface Answer {
  correctOptions: string[];
  explanations: Option;
}

export type Params = {
  topic: string;
  numQuestions: number;
  difficulty: { easy: number; medium: number; hard: number };
  newPercent: number; // 0..1
  newCount?: number | null;
  dryRun: boolean;
  timeoutMs: number;
};

export type AnswersMap = Record<number, string[]>;
export type Option = Record<string, string>;
export interface QuizPayload {
  meta: { topic: string; num_questions: number };
  questions: Question[];
  answers: AnswersMap;
  isFinished: boolean;
}