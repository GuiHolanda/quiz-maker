import type { MockExamQuestionSource } from '@/shared/types';

import { SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';

export interface SimuladoPrefill {
  examId: string;
  name?: string;
  totalQuestions: number;
  durationMinutes: number | null;
  questionSource: MockExamQuestionSource;
  sections: { sectionName: string; questionCount: number }[];
}

export function writeSimuladoPrefill(p: SimuladoPrefill): void {
  try {
    localStorage.setItem(SIMULADO_NEW_PREFILL_KEY, JSON.stringify(p));
  } catch {}
}

export function readSimuladoPrefill(): SimuladoPrefill | null {
  const raw = localStorage.getItem(SIMULADO_NEW_PREFILL_KEY);

  if (!raw) return null;
  localStorage.removeItem(SIMULADO_NEW_PREFILL_KEY);

  try {
    const p = JSON.parse(raw);

    if (!p?.examId || typeof p.totalQuestions !== 'number') return null;

    return {
      examId: p.examId,
      name: p.name ?? undefined,
      totalQuestions: p.totalQuestions,
      durationMinutes: p.durationMinutes ?? null,
      questionSource: p.questionSource ?? 'library',
      sections: Array.isArray(p.sections) ? p.sections : [],
    };
  } catch {
    return null;
  }
}
