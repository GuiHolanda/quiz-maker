import type { ExamLandingConfig, ExamLandingTopic } from '@/shared/types';

// Share of the simulado already elapsed in the mock panel — the progress bar and
// the remaining-time clock are drawn from this single number so they never
// disagree.
const SIMULADO_PROGRESS = 0.58;

export const SIMULADO_PROGRESS_PERCENT = Math.round(SIMULADO_PROGRESS * 100);

export function formatExamDuration(minutes: number): string {
  if (minutes < 120) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}

// Deterministic on purpose: a live clock would differ between the server render
// and the client hydration.
export function formatRemainingClock(totalMinutes: number): string {
  const remaining = Math.round(totalMinutes * (1 - SIMULADO_PROGRESS));
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  return [hours, minutes, 0].map((part) => String(part).padStart(2, '0')).join(':');
}

export interface SimuladoRow {
  readonly name: string;
  readonly questionCount: number;
}

export function simuladoRows(config: ExamLandingConfig, limit: number): readonly SimuladoRow[] {
  return sortedTopics(config)
    .slice(0, limit)
    .map((topic) => ({
      name: topic.name,
      questionCount: Math.max(1, Math.round((topic.weight / 100) * config.totalQuestions)),
    }));
}

export function sortedTopics(config: ExamLandingConfig): readonly ExamLandingTopic[] {
  return [...config.topics].sort((topic, other) => other.weight - topic.weight);
}

export function heaviestTopicWeight(config: ExamLandingConfig): number {
  return config.topics.reduce((heaviest, topic) => Math.max(heaviest, topic.weight), 1);
}
