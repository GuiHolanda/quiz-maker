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
