export interface DemoPoolQuestion {
  readonly section: string;
  readonly text: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly options: Record<string, string>;
  readonly correctOptions: string[];
  readonly explanations: Record<string, string>;
}

export interface DemoPoolExam {
  readonly examName: string;
  // Alternatives per question in the real exam. AWS-style exams use a wider set
  // for multiple-response items, so the two counts are declared separately and
  // enforced by the seed script.
  readonly optionCount: number;
  readonly multiOptionCount?: number;
  readonly formatNote?: string;
  readonly questions: readonly DemoPoolQuestion[];
}

export function expectedOptionCount(exam: DemoPoolExam, correctCount: number): number {
  if (correctCount > 1) return exam.multiOptionCount ?? exam.optionCount;
  return exam.optionCount;
}
