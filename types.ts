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
  questions: Array<{
    id: number;
    question: string;
    correct_count: number;
    options: Record<string, string>;
    topic_subarea: string;
    difficulty: string;
    estimated_time_sec: number;
  }>;
  answers: Array<{
    question_id: number;
    correct_options: string[];
    explanations: Record<string, string>;
  }>;
}