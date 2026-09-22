interface ReadinessSection {
  readonly id: string;
  readonly topics: readonly { readonly id: string }[];
}

interface ReadinessQuestion {
  readonly sectionId: string | null;
  readonly topicId: string | null;
}

export function computeExamReadiness(
  sections: readonly ReadinessSection[],
  questions: readonly ReadinessQuestion[],
): number {
  if (sections.length === 0) return 0;

  const topics = sections.flatMap((section) => section.topics);

  if (topics.length > 0) {
    const covered = topics.filter((topic) => questions.some((q) => q.topicId === topic.id)).length;
    return Math.round((covered / topics.length) * 100);
  }

  const covered = sections.filter((section) => questions.some((q) => q.sectionId === section.id)).length;
  return Math.round((covered / sections.length) * 100);
}
