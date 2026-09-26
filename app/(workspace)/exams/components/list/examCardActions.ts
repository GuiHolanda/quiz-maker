import { faFileLines, faWandMagicSparkles, type IconDefinition } from '@fortawesome/free-solid-svg-icons';

import type { ReadinessNoteAction } from './examReadinessNote';

import type { Exam } from '@/shared/types';

interface ExamCardAction {
  readonly labelKey: string;
  readonly icon: IconDefinition;
  readonly href: (examId: Exam['id']) => string;
}

export const EXAM_CARD_ACTIONS: Record<ReadinessNoteAction, ExamCardAction> = {
  generate: {
    labelKey: 'exam.actionGenerate',
    icon: faWandMagicSparkles,
    href: (examId) => `/questions?examId=${examId}`,
  },
  simulado: {
    labelKey: 'exam.actionCreateSimulado',
    icon: faFileLines,
    href: (examId) => `/simulados?examId=${examId}`,
  },
};
