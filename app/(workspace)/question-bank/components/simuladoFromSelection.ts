import type { UnifiedQuestion } from '@/shared/types';

import type { SimuladoPrefill } from '@/app/(workspace)/simulados/components/create/simuladoPrefill';

export function buildSimuladoPrefillFromQuestions(questions: UnifiedQuestion[]): SimuladoPrefill | null {
  if (questions.length === 0) return null;

  const examId = questions[0].examId;

  if (!examId || questions.some((question) => question.examId !== examId)) return null;

  const countBySection = new Map<string, number>();
  for (const question of questions) {
    countBySection.set(question.sectionName, (countBySection.get(question.sectionName) ?? 0) + 1);
  }

  return {
    examId,
    totalQuestions: questions.length,
    questionSource: 'library',
    sections: Array.from(countBySection.entries()).map(([sectionName, questionCount]) => ({
      sectionName,
      questionCount,
    })),
  };
}
