import type { DemoQuestion } from '@/shared/types';

// Real certification questions can have more than one correct option, so a hit
// is an exact set match — partial selections never score.
export function isAnswerCorrect(selected: readonly number[] | undefined, correctIndexes: readonly number[]): boolean {
  if (!selected || selected.length !== correctIndexes.length) return false;

  const chosen = new Set(selected);
  return correctIndexes.every((index) => chosen.has(index));
}

// A question counts as answered once the user picked as many options as the
// question expects — the same "Choose TWO" convention the real exams use.
export function isAnswerComplete(selected: readonly number[] | undefined, question: DemoQuestion): boolean {
  return (selected?.length ?? 0) === question.correctIndexes.length;
}

export function selectionLimit(question: DemoQuestion): number {
  return Math.max(1, question.correctIndexes.length);
}

export function toggleSelection(current: readonly number[], optionIndex: number, limit: number): number[] {
  if (current.includes(optionIndex)) {
    return current.filter((index) => index !== optionIndex);
  }

  return [...current, optionIndex].slice(-limit);
}
