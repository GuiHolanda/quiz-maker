import { blueprintWeights } from '@/lib/exam';
import type { Exam } from '@/shared/types';

export type ReadinessNoteAction = 'generate' | 'simulado';

interface ReadinessNote {
  readonly key: string;
  readonly params?: Record<string, number>;
  readonly action?: ReadinessNoteAction;
}

export function readinessNote(exam: Exam): ReadinessNote {
  const readiness = exam.readiness;

  if (exam.status === 'completed') return { key: 'exam.readinessNoteCompleted' };
  if (!readiness || readiness.phase === 'no_sections') return { key: 'exam.readinessNoteDraft' };

  if (readiness.phase === 'building_bank') {
    const missing = readiness.targetQuestions - readiness.coveredQuestions;
    const key = missing === 1 ? 'exam.readinessNoteBuildingOne' : 'exam.readinessNoteBuilding';

    return { key, params: { count: missing }, action: 'generate' };
  }

  if (readiness.phase === 'ready_to_measure') return { key: 'exam.readinessNoteReady', action: 'simulado' };

  const weights = blueprintWeights(exam.sections);
  const weightless = new Set(exam.sections.filter((_, i) => weights[i] === 0).map((section) => section.id));
  const untested = readiness.sections.filter(
    (entry) => entry.accuracyPercent === null && !weightless.has(entry.sectionId)
  ).length;

  if (untested > 0) {
    const key = untested === 1 ? 'exam.readinessNoteUntestedOne' : 'exam.readinessNoteUntested';

    return { key, params: { count: untested } };
  }

  const cut = exam.passingScore;

  if (cut == null) return { key: 'exam.readinessNoteNoCut' };

  const projected = readiness.projectedPercent ?? 0;

  if (projected >= cut) return { key: 'exam.readinessNoteAboveCut', params: { cut } };

  const delta = Math.ceil(cut - projected);

  const key = delta === 1 ? 'exam.readinessNoteBelowCutOne' : 'exam.readinessNoteBelowCut';

  return { key, params: { delta, cut } };
}
