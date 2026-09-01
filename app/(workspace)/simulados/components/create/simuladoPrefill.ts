import type { MockExamQuestionSource } from '@/shared/types';

import { SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';

export interface SimuladoPrefill {
  examId: string;
  name?: string;
  totalQuestions: number;
  durationMinutes?: number | null;
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
    const p = JSON.parse(raw) as Partial<SimuladoPrefill> & { type?: string };

    if (!p?.examId || typeof p.totalQuestions !== 'number') return null;

    const prefill: SimuladoPrefill = {
      examId: p.examId,
      name: p.name ?? undefined,
      totalQuestions: p.totalQuestions,
      questionSource: p.questionSource ?? 'library',
      sections: Array.isArray(p.sections) ? p.sections : [],
    };

    if ('durationMinutes' in p) prefill.durationMinutes = p.durationMinutes ?? null;

    return prefill;
  } catch {
    return null;
  }
}

export function buildSimuladoPrefillFromJob(job: {
  refKey: string;
  topics: readonly { topicName: string; savedCount: number }[];
}): SimuladoPrefill | null {
  const sections = job.topics
    .filter((topic) => topic.savedCount > 0)
    .map((topic) => ({ sectionName: topic.topicName, questionCount: topic.savedCount }));
  const totalQuestions = sections.reduce((sum, section) => sum + section.questionCount, 0);

  if (totalQuestions === 0) return null;

  return { examId: job.refKey, totalQuestions, questionSource: 'library', sections };
}
