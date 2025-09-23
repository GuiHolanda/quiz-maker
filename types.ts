export interface RequestBody {
  num_questions: number;
  topic: string;
  difficulty_distribution: { easy: number; medium: number; hard: number };
}