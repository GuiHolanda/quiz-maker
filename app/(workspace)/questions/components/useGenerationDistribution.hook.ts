'use client';

import { useCallback, useMemo, useState } from 'react';

export interface WeightedTopic {
  readonly name: string;
  readonly weight: number;
}

export interface DistributionRow {
  readonly name: string;
  readonly weight: number;
  readonly count: number;
  readonly barPercent: number;
}

export interface DistributionEntry {
  readonly topicName: string;
  readonly questionCount: number;
}

// Largest remainder method — a soma dos counts é exatamente `total`.
function distributeByWeight(items: ReadonlyArray<WeightedTopic>, total: number): Record<string, number> {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  if (totalWeight === 0 || total <= 0) {
    return Object.fromEntries(items.map((item) => [item.name, 0]));
  }

  const floors = items.map((item) => {
    const exact = (item.weight / totalWeight) * total;
    const count = Math.floor(exact);
    return { name: item.name, count, remainder: exact - count };
  });
  const remaining = total - floors.reduce((acc, item) => acc + item.count, 0);
  const ranked = [...floors].sort((a, b) => b.remainder - a.remainder);
  const bonus = new Set(ranked.slice(0, remaining).map((item) => item.name));

  return Object.fromEntries(floors.map((item) => [item.name, item.count + (bonus.has(item.name) ? 1 : 0)]));
}

interface UseGenerationDistributionResult {
  readonly rows: DistributionRow[];
  readonly currentTotal: number;
  readonly activeCount: number;
  readonly isModified: boolean;
  readonly setCount: (name: string, value: number) => void;
  readonly remove: (name: string) => void;
  readonly redistribute: () => void;
  readonly buildDistribution: () => DistributionEntry[];
}

export function useGenerationDistribution(
  topics: ReadonlyArray<WeightedTopic>,
  defaultTotal: number,
  total: number,
  resetKey: string
): UseGenerationDistributionResult {
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [counts, setCounts] = useState<Record<string, number>>(() => distributeByWeight(topics, defaultTotal));
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [syncKey, setSyncKey] = useState(`${resetKey}|${total}`);

  const nextSyncKey = `${resetKey}|${total}`;
  if (syncKey !== nextSyncKey) {
    const isExamChange = !syncKey.startsWith(`${resetKey}|`);
    const nextRemoved = isExamChange ? new Set<string>() : removed;
    const activeTopics = topics.filter((topic) => !nextRemoved.has(topic.name));

    setSyncKey(nextSyncKey);
    if (isExamChange) setRemoved(nextRemoved);
    setCounts(distributeByWeight(activeTopics, total));
    setManuallyEdited(false);
  }

  const activeTopics = useMemo(
    () => topics.filter((topic) => !removed.has(topic.name)).sort((a, b) => b.weight - a.weight),
    [topics, removed]
  );

  const currentTotal = activeTopics.reduce((acc, topic) => acc + (counts[topic.name] ?? 0), 0);

  const rows: DistributionRow[] = activeTopics.map((topic) => {
    const count = counts[topic.name] ?? 0;
    return {
      name: topic.name,
      weight: topic.weight,
      count,
      barPercent: total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0,
    };
  });

  const setCount = useCallback((name: string, value: number) => {
    setManuallyEdited(true);
    setCounts((prev) => ({ ...prev, [name]: Math.max(0, value) }));
  }, []);

  const remove = useCallback(
    (name: string) => {
      setRemoved((prev) => {
        const next = new Set(prev);
        next.add(name);
        const remaining = topics.filter((topic) => !next.has(topic.name));
        setCounts(distributeByWeight(remaining, total));
        return next;
      });
      setManuallyEdited(false);
    },
    [topics, total]
  );

  const redistribute = useCallback(() => {
    const remaining = topics.filter((topic) => !removed.has(topic.name));
    setCounts(distributeByWeight(remaining, total));
    setManuallyEdited(false);
  }, [topics, removed, total]);

  const buildDistribution = useCallback(
    () =>
      activeTopics
        .map((topic) => ({ topicName: topic.name, questionCount: counts[topic.name] ?? 0 }))
        .filter((entry) => entry.questionCount > 0),
    [activeTopics, counts]
  );

  return {
    rows,
    currentTotal,
    activeCount: activeTopics.length,
    isModified: manuallyEdited || removed.size > 0 || total !== defaultTotal,
    setCount,
    remove,
    redistribute,
    buildDistribution,
  };
}
