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
