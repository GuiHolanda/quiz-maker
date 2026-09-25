import type { ExamType } from '@/shared/types';

interface ExamCounts {
  readonly certifications: number;
  readonly publicExams: number;
}

export function parseRequestedScope(value: string | null): ExamType | null {
  return value === 'certification' || value === 'public_exam' ? value : null;
}

export function resolveGenerationScope(chosen: ExamType | null, counts: ExamCounts): ExamType {
  if (chosen) return chosen;

  return counts.certifications === 0 && counts.publicExams > 0 ? 'public_exam' : 'certification';
}
