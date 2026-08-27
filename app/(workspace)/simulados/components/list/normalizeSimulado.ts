import { ExamType, MockExamListItem } from '@/shared/types';

export interface AttemptRow {
  id: number;
  score: number | null;
  finishedAt: string | null;
}

export interface UnifiedSimulado {
  key: string;
  id: number;
  type: ExamType;
  name: string | null;
  sourceLabel: string;
  totalQuestions: number;
  durationMinutes: number | null;
  passingScorePercent: number | null;
  attemptCount: number;
  bestScore: number | null;
  openAttemptId: number | null;
  lastAttemptId: number | null;
  lastFinishedAt: string | null;
  createdAt: string;
  attempts: AttemptRow[];
  status: 'answered' | 'pending' | 'in_progress';
}

export function normalizeMock(m: MockExamListItem): UnifiedSimulado {
  return {
    key: `${m.exam.type}-${m.id}`,
    id: m.id,
    type: m.exam.type,
    name: m.name,
    sourceLabel: m.exam.name,
    totalQuestions: m.totalQuestions,
    durationMinutes: m.durationMinutes,
    passingScorePercent: m.passingScorePercent,
    attemptCount: m.attemptCount,
    bestScore: m.bestScore,
    openAttemptId: m.openAttemptId,
    lastAttemptId: m.lastAttemptId,
    lastFinishedAt: m.attempts[0]?.finishedAt ?? null,
    createdAt: m.createdAt,
    attempts: m.attempts.map((a) => ({ id: a.id, score: a.score, finishedAt: a.finishedAt })),
    status: deriveStatus(m.openAttemptId, m.attemptCount),
  };
}

export function deriveStatus(openAttemptId: number | null, attemptCount: number): UnifiedSimulado['status'] {
  if (openAttemptId != null) return 'in_progress';
  if (attemptCount > 0) return 'answered';

  return 'pending';
}

export function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
}

export function fmtTempo(minutes: number | null): string {
  if (minutes == null) return 'livre';
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${hours}h${rest.toString().padStart(2, '0')}`;
}
