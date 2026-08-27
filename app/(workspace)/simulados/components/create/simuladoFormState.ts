import type {
  CreateMockExamPayload,
  Exam,
  ExamSection,
  ExamType,
  MockExamQuestionSource,
  MockExamSectionConfig,
} from '@/shared/types';

export type TimeMode = 'oficial' | 'livre' | 'personalizado';

export interface SimuladoFormState {
  name: string;
  scope: ExamType;
  examId: string | null;
  totalQuestions: number;
  timeMode: TimeMode;
  customMinutes: number;
  source: MockExamQuestionSource;
  selectedSections: string[];
}

export function sectionWeights(sections: ExamSection[]): Record<string, number> {
  const totalMax = sections.reduce((sum, section) => sum + section.maxQuestions, 0);
  const weights: Record<string, number> = {};

  for (const section of sections) {
    weights[section.name] = totalMax > 0 ? Math.round((section.maxQuestions / totalMax) * 100) : 0;
  }

  return weights;
}

export function distributeQuestions(
  sections: ExamSection[],
  selected: string[],
  total: number
): MockExamSectionConfig[] {
  const selectedSections = sections.filter((section) => selected.includes(section.name));
  const selectedMaxSum = selectedSections.reduce((sum, section) => sum + section.maxQuestions, 0);

  const distribution: MockExamSectionConfig[] = selectedSections.map((section) => {
    const proportional = selectedMaxSum > 0 ? Math.round((total * section.maxQuestions) / selectedMaxSum) : 0;

    return { sectionName: section.name, questionCount: proportional };
  });

  if (distribution.length > 0) {
    const othersSum = distribution.slice(0, -1).reduce((sum, entry) => sum + entry.questionCount, 0);

    distribution[distribution.length - 1].questionCount = total - othersSum;
  }

  return distribution;
}

export function coveragePercent(sections: ExamSection[], selected: string[]): number {
  const totalMax = sections.reduce((sum, section) => sum + section.maxQuestions, 0);

  if (totalMax === 0) return 0;

  const selectedMax = sections
    .filter((section) => selected.includes(section.name))
    .reduce((sum, section) => sum + section.maxQuestions, 0);

  return Math.round((selectedMax / totalMax) * 100);
}

export function resolveDurationMinutes(state: SimuladoFormState, exam: Exam | null): number | null {
  if (state.timeMode === 'livre') return null;
  if (state.timeMode === 'personalizado') return state.customMinutes;

  return exam?.examDurationMinutes ?? null;
}

export function buildCreatePayload(state: SimuladoFormState, exam: Exam): CreateMockExamPayload {
  return {
    examId: exam.id ?? '',
    name: state.name.trim() || undefined,
    totalQuestions: state.totalQuestions,
    sections: distributeQuestions(exam.sections, state.selectedSections, state.totalQuestions),
    durationMinutes: resolveDurationMinutes(state, exam),
    questionSource: state.source,
  };
}
