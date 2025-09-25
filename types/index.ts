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
  options: Record<string, string>;
  topicSubarea: string;
  difficulty: string;
}

export interface Options {
  id: number;
  questionId: number;
  question: Question;
  explanations: Explanation[];
  label: string;
  text: string;
}

export interface Answer {
  id: number;
  questionId: number;
  question: Question;
  correctOptions: string[];
  explanations: Explanation[];
}

export interface Explanation {
  id: number;
  questionId: number;
  question: Question;
  answerId?: number;
  answer?: Answer;
  optionId?: number;
  option?: Options;
  text: string;
}