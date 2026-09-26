import type { ExamReadiness, SectionReadiness } from '@/shared/types';

// NFC + trim + collapsed whitespace (incl. NBSP) is the only normalization the platform performs:
// never lowercase or strip accents, they carry meaning. Apply on every write boundary.
export function normalizeName(s: string): string {
  return s.normalize('NFC').replace(/\s+/g, ' ').trim();
}

// Diagnostics/recovery only — never persist.
export function looseKey(s: string): string {
  return normalizeName(s).toLowerCase();
}

export function toSafeString(v: unknown) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  const json = JSON.stringify(v);

  return json || Object.prototype.toString.call(v);
}

const READINESS_ANSWER_WINDOW = 30;

interface ReadinessInput {
  readonly sections: readonly { readonly id: string; readonly minQuestions: number; readonly maxQuestions: number }[];
  readonly totalQuestions: number;
  readonly questions: readonly { readonly sectionId: string | null }[];
  readonly answers: readonly {
    readonly sectionId: string | null;
    readonly isCorrect: boolean;
    readonly answeredAt: Date;
  }[];
}

export function computeExamReadiness({ sections, totalQuestions, questions, answers }: ReadinessInput): ExamReadiness {
  if (sections.length === 0) {
    return { phase: 'no_sections', projectedPercent: null, coveredQuestions: 0, targetQuestions: 0, sections: [] };
  }

  const midpointWeights = sections.map((section) => (section.minQuestions + section.maxQuestions) / 2);
  const hasAnyWeight = midpointWeights.some((weight) => weight > 0);
  const weights = hasAnyWeight ? midpointWeights : sections.map(() => 1);

  const targets = distributeByWeight(
    sections.map((section, i) => ({ key: section.id, weight: weights[i], capacity: Number.POSITIVE_INFINITY })),
    totalQuestions
  );

  const sectionReadiness: SectionReadiness[] = sections.map((section) => {
    const recentAnswers = answers
      .filter((answer) => answer.sectionId === section.id)
      .sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime())
      .slice(0, READINESS_ANSWER_WINDOW);
    const correctCount = recentAnswers.filter((answer) => answer.isCorrect).length;

    return {
      sectionId: section.id,
      questionCount: questions.filter((question) => question.sectionId === section.id).length,
      targetCount: targets[section.id],
      accuracyPercent: recentAnswers.length > 0 ? (correctCount / recentAnswers.length) * 100 : null,
    };
  });

  const coveredQuestions = sectionReadiness.reduce(
    (sum, entry) => sum + Math.min(entry.questionCount, entry.targetCount),
    0
  );
  const targetQuestions = sectionReadiness.reduce((sum, entry) => sum + entry.targetCount, 0);
  const isMeasured = sectionReadiness.some((entry) => entry.accuracyPercent !== null);

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const projectedPercent = isMeasured
    ? Math.round(
        sectionReadiness.reduce((sum, entry, i) => sum + weights[i] * (entry.accuracyPercent ?? 0), 0) / weightSum
      )
    : null;

  const isBankComplete = sectionReadiness.every((entry) => entry.questionCount >= entry.targetCount);
  const phase = isMeasured ? 'measured' : isBankComplete ? 'ready_to_measure' : 'building_bank';

  return {
    phase,
    projectedPercent,
    coveredQuestions,
    targetQuestions,
    sections: sectionReadiness.map((entry) => ({
      ...entry,
      accuracyPercent: entry.accuracyPercent === null ? null : Math.round(entry.accuracyPercent),
    })),
  };
}

function readinessRank(readiness: ExamReadiness | undefined): [number, number] {
  if (!readiness || readiness.phase === 'no_sections') return [0, 0];
  if (readiness.phase === 'measured') return [2, readiness.projectedPercent ?? 0];

  return [1, readiness.targetQuestions > 0 ? readiness.coveredQuestions / readiness.targetQuestions : 1];
}

export function compareReadinessAscending(a: ExamReadiness | undefined, b: ExamReadiness | undefined): number {
  const [tierA, valueA] = readinessRank(a);
  const [tierB, valueB] = readinessRank(b);

  return tierA - tierB || valueA - valueB;
}

export interface WeightedSlot {
  readonly key: string;
  readonly weight: number;
  readonly capacity: number;
}

// Largest-remainder apportionment with a hard ceiling per slot. Whatever a
// ceiling pushes back is handed to the slots that still have room, so the total
// is only short when every slot is full.
export function distributeByWeight(slots: readonly WeightedSlot[], total: number): Record<string, number> {
  const result: Record<string, number> = Object.fromEntries(slots.map((slot) => [slot.key, 0]));

  if (total <= 0) return result;

  const usable = slots.filter((slot) => slot.capacity > 0);
  if (usable.length === 0) return result;

  const weightSum = usable.reduce((sum, slot) => sum + slot.weight, 0);

  const items = usable.map((slot) => {
    const exact = weightSum > 0 ? (slot.weight / weightSum) * total : total / usable.length;
    return {
      key: slot.key,
      capacity: slot.capacity,
      assigned: Math.min(Math.floor(exact), slot.capacity),
      remainder: exact % 1,
    };
  });

  let remaining = total - items.reduce((sum, item) => sum + item.assigned, 0);
  const byRemainder = [...items].sort((a, b) => b.remainder - a.remainder);

  while (remaining > 0) {
    const remainingBefore = remaining;

    for (const item of byRemainder) {
      if (remaining <= 0) break;
      if (item.assigned >= item.capacity) continue;
      item.assigned += 1;
      remaining -= 1;
    }

    if (remaining === remainingBefore) break;
  }

  items.forEach((item) => {
    result[item.key] = item.assigned;
  });

  return result;
}

// The drafting LLM writes the correct alternative first almost every time, and the
// pipeline persists the letters exactly as the model emitted them — so "A" ends up
// correct far more often than chance, and the quiz becomes answerable without
// reading the question.
//
// Reassigning the texts to a random permutation of the same label set removes that
// signal: the labels stay A..N, only which text sits under each one moves. This must
// run before the options are persisted, because the answers step derives the gabarito
// from the stored options — it sees the shuffled order and stays consistent with it.
export function shuffleOptionTexts(
  options: Record<string, string>,
  random: () => number = Math.random
): Record<string, string> {
  const labels = Object.keys(options).sort();
  const texts = shuffleItems(
    labels.map((label) => options[label]),
    random
  );

  return labels.reduce<Record<string, string>>((shuffled, label, index) => {
    shuffled[label] = texts[index];

    return shuffled;
  }, {});
}

export function shuffleItems<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
