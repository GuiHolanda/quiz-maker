import { scoreToneName, toneBg, type ScoreToneName } from '@/shared/lib/scoreTone';
import type { ExamReadiness } from '@/shared/types';

const NEAR_CUT_POINTS = 10;

export function readinessTone(percent: number, passingScore: number | null): ScoreToneName {
  if (passingScore == null) return scoreToneName(percent);
  if (percent >= passingScore) return 'success';
  if (percent >= passingScore - NEAR_CUT_POINTS) return 'warning';

  return 'danger';
}

interface ReadinessBar {
  readonly value: number;
  readonly fillClass: string;
  readonly markerPercent: number | null;
}

export function readinessBar(readiness: ExamReadiness | undefined, passingScore: number | null): ReadinessBar {
  if (!readiness || readiness.phase === 'no_sections') {
    return { value: 0, fillClass: 'bg-primary', markerPercent: null };
  }

  if (readiness.phase === 'measured') {
    const projected = readiness.projectedPercent ?? 0;

    return {
      value: projected,
      fillClass: toneBg(readinessTone(projected, passingScore)),
      markerPercent: passingScore ?? null,
    };
  }

  const bankProgress =
    readiness.targetQuestions > 0 ? Math.floor((readiness.coveredQuestions / readiness.targetQuestions) * 100) : 100;

  return { value: bankProgress, fillClass: 'bg-primary', markerPercent: null };
}
