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
    readonly id: number;
    readonly sectionId: string | null;
    readonly isCorrect: boolean;
    readonly answeredAt: Date;
  }[];
}

export function blueprintWeights(sections: readonly { readonly maxQuestions: number }[]): number[] {
  const hasAnyWeight = sections.some((section) => section.maxQuestions > 0);

  return sections.map((section) => (hasAnyWeight ? section.maxQuestions : 1));
}

export function blueprintDistribution(sections: readonly { readonly maxQuestions: number }[], total: number): number[] {
  const weights = blueprintWeights(sections);
  const counts = distributeByWeight(
    weights.map((weight, i) => ({ key: String(i), weight, capacity: Number.POSITIVE_INFINITY })),
    total
  );

  return weights.map((_, i) => counts[String(i)]);
}

export function computeExamReadiness({ sections, totalQuestions, questions, answers }: ReadinessInput): ExamReadiness {
  if (sections.length === 0) {
    return { phase: 'no_sections', projectedPercent: null, coveredQuestions: 0, targetQuestions: 0, sections: [] };
  }

  const weights = blueprintWeights(sections);
  const targets = blueprintDistribution(sections, totalQuestions);

  const sectionReadiness: SectionReadiness[] = sections.map((section, i) => {
    const recentAnswers = answers
      .filter((answer) => answer.sectionId === section.id)
      .sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime() || b.id - a.id)
      .slice(0, READINESS_ANSWER_WINDOW);
    const correctCount = recentAnswers.filter((answer) => answer.isCorrect).length;

    return {
      sectionId: section.id,
      questionCount: questions.filter((question) => question.sectionId === section.id).length,
      targetCount: targets[i],
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

export interface ExamQuestionRef {
  readonly examId: string | null;
  readonly sectionId: string | null;
  readonly examName: string;
  readonly sectionName: string;
}

export interface ReadinessAnswer {
  readonly id: number;
  readonly isCorrect: boolean;
  readonly answeredAt: Date;
  readonly question: ExamQuestionRef;
}

interface ReadinessExam {
  readonly name: string;
  readonly totalQuestions: number;
  readonly sections: readonly {
    readonly id: string;
    readonly name: string;
    readonly minQuestions: number;
    readonly maxQuestions: number;
  }[];
}

// Mirrors the simulado's draw (mock-exam.service): a question without sectionId still
// belongs to a section when its denormalized exam and section names match.
function readinessSectionId(question: ExamQuestionRef, exam: ReadinessExam): string | null {
  if (question.sectionId !== null) return question.sectionId;
  if (question.examName !== exam.name) return null;

  return exam.sections.find((section) => normalizeName(section.name) === question.sectionName)?.id ?? null;
}

export function examReadiness(
  exam: ReadinessExam,
  questions: readonly ExamQuestionRef[],
  answers: readonly ReadinessAnswer[]
): ExamReadiness {
  return computeExamReadiness({
    sections: exam.sections,
    totalQuestions: exam.totalQuestions,
    questions: questions.map((question) => ({ sectionId: readinessSectionId(question, exam) })),
    answers: answers.map((answer) => ({
      id: answer.id,
      sectionId: readinessSectionId(answer.question, exam),
      isCorrect: answer.isCorrect,
      answeredAt: answer.answeredAt,
    })),
  });
}

export function groupByExam<T>(
  exams: readonly { readonly id: string; readonly name: string }[],
  rows: readonly T[],
  questionOf: (row: T) => ExamQuestionRef
): Map<string, T[]> {
  const grouped = new Map<string, T[]>(exams.map((exam) => [exam.id, []]));
  const examIdsByName = new Map<string, string[]>();

  exams.forEach((exam) => examIdsByName.set(exam.name, [...(examIdsByName.get(exam.name) ?? []), exam.id]));

  rows.forEach((row) => {
    const question = questionOf(row);
    const legacyOwners = question.sectionId === null ? (examIdsByName.get(question.examName) ?? []) : [];
    const owners = new Set(question.examId === null ? legacyOwners : [question.examId, ...legacyOwners]);

    owners.forEach((examId) => grouped.get(examId)?.push(row));
  });

  return grouped;
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
