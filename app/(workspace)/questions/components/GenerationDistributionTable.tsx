'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface WeightedTopic {
  readonly name: string;
  readonly weight: number;
}

interface GenerationDistributionTableProps {
  readonly topics: ReadonlyArray<WeightedTopic>;
  readonly defaultTotal: number;
  readonly onGenerate: (distribution: Array<{ topicName: string; questionCount: number }>) => void;
  readonly isGenerating?: boolean;
}

// Largest remainder method — garante que a soma dos counts seja exatamente `total`.
function distributeByWeight(items: ReadonlyArray<WeightedTopic>, total: number): Record<string, number> {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  if (totalWeight === 0 || total === 0) {
    return Object.fromEntries(items.map((item) => [item.name, 0]));
  }

  const floors = items.map((item) => {
    const exact = (item.weight / totalWeight) * total;
    const count = Math.floor(exact);
    return { name: item.name, count, remainder: exact - count };
  });
  const remaining = total - floors.reduce((acc, item) => acc + item.count, 0);

  const ranked = [...floors].sort((a, b) => b.remainder - a.remainder);
  const bonusNames = new Set(ranked.slice(0, remaining).map((item) => item.name));

  return Object.fromEntries(floors.map((item) => [item.name, item.count + (bonusNames.has(item.name) ? 1 : 0)]));
}

export function GenerationDistributionTable({
  topics,
  defaultTotal,
  onGenerate,
  isGenerating = false,
}: Readonly<GenerationDistributionTableProps>) {
  const { t } = useTranslation();

  const [total, setTotal] = useState(defaultTotal);
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>(() => distributeByWeight(topics, defaultTotal));

  const activeTopics = topics.filter((topic) => !removed.has(topic.name));
  const currentTotal = activeTopics.reduce((acc, topic) => acc + (counts[topic.name] ?? 0), 0);
  const isModified = total !== defaultTotal || removed.size > 0 || manuallyEdited;

  function recompute(nextTotal: number, nextRemoved: Set<string>) {
    const active = topics.filter((topic) => !nextRemoved.has(topic.name));
    setCounts(distributeByWeight(active, nextTotal));
  }

  function handleTotalChange(value: string) {
    const next = Number(value) || 0;
    setTotal(next);
    setManuallyEdited(false);
    recompute(next, removed);
  }

  function handleCountChange(name: string, value: string) {
    setManuallyEdited(true);
    setCounts((prev) => ({ ...prev, [name]: Number(value) || 0 }));
  }

  function handleRemove(name: string) {
    const nextRemoved = new Set(removed);
    nextRemoved.add(name);
    setRemoved(nextRemoved);
    setManuallyEdited(false);
    recompute(total, nextRemoved);
  }

  function handleReset() {
    setTotal(defaultTotal);
    setRemoved(new Set());
    setManuallyEdited(false);
    setCounts(distributeByWeight(topics, defaultTotal));
  }

  function handleGenerate() {
    const distribution = activeTopics
      .map((topic) => ({ topicName: topic.name, questionCount: counts[topic.name] ?? 0 }))
      .filter((entry) => entry.questionCount > 0);
    onGenerate(distribution);
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-end justify-between gap-4">
        <div className="no-number-spinners w-1/3">
          <Input
            id="total_questions"
            isDisabled={isGenerating}
            label={t('generate.totalQuestions')}
            min={1}
            placeholder={t('generate.totalQuestionsPlaceholder')}
            type="number"
            value={String(total)}
            variant="bordered"
            onValueChange={handleTotalChange}
          />
        </div>
        <span className="text-xs font-medium text-success pb-2">
          {t('simulado.distributed', { distributed: currentTotal, total: currentTotal })}
        </span>
      </div>

      <div className="bg-content2 border border-default-200 rounded-xl overflow-hidden">
        {activeTopics.length === 0 ? (
          <p className="text-xs text-default-400 px-4 py-3">{t('generate.noTopicsLeft')}</p>
        ) : (
          activeTopics.map((topic, i) => {
            const isLast = i === activeTopics.length - 1;
            const currentCount = counts[topic.name] ?? 0;

            return (
              <div
                key={topic.name}
                className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-default-200' : ''}`}
              >
                <span className="text-sm text-foreground truncate flex-1 min-w-0">{topic.name}</span>
                <Input
                  aria-label={t('simulado.topicQuestionCountLabel', { topic: topic.name })}
                  className="w-20 shrink-0"
                  classNames={{ inputWrapper: 'h-8' }}
                  isDisabled={isGenerating}
                  min={0}
                  size="sm"
                  type="number"
                  value={String(currentCount)}
                  variant="bordered"
                  onValueChange={(v) => handleCountChange(topic.name, v)}
                />
                <Button
                  isIconOnly
                  aria-label={t('generate.removeTopic', { topic: topic.name })}
                  className={buttonStyles.iconOnly.danger}
                  isDisabled={isGenerating}
                  size="sm"
                  variant="light"
                  onPress={() => handleRemove(topic.name)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {isModified ? (
          <Button
            className={buttonStyles.secondary}
            isDisabled={isGenerating}
            size="sm"
            startContent={<FontAwesomeIcon icon={faRotateLeft} />}
            variant="bordered"
            onPress={handleReset}
          >
            {t('generate.resetDistribution')}
          </Button>
        ) : (
          <span />
        )}
        <Button
          className={buttonStyles.primary}
          isDisabled={currentTotal === 0 || isGenerating}
          onPress={handleGenerate}
        >
          {t('common.generate')}
        </Button>
      </div>
    </div>
  );
}
