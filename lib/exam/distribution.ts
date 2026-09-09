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
