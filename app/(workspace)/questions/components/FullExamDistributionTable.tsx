'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface DistributionItem {
  readonly name: string;
  readonly available: number;
  readonly count: number;
}

interface FullExamDistributionTableProps {
  readonly items: ReadonlyArray<DistributionItem>;
  readonly onGenerate: (distribution: Array<{ topicName: string; questionCount: number }>) => void;
  readonly isGenerating?: boolean;
}

export function FullExamDistributionTable({ items, onGenerate, isGenerating = false }: Readonly<FullExamDistributionTableProps>) {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(items.map((item) => [item.name, item.count])),
  );

  const total = Object.values(counts).reduce((acc, c) => acc + c, 0);

  function handleCountChange(name: string, value: string) {
    setCounts((prev) => ({ ...prev, [name]: Number(value) || 0 }));
  }

  function handleGenerate() {
    const distribution = items
      .map(({ name }) => ({ topicName: name, questionCount: counts[name] ?? 0 }))
      .filter((entry) => entry.questionCount > 0);
    onGenerate(distribution);
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-default-500">{t('simulado.distributionByTopic')}</p>
        <span className="text-xs font-medium text-success">{t('simulado.distributed', { distributed: total, total })}</span>
      </div>
      <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const currentCount = counts[item.name] ?? 0;
          const isInsufficient = currentCount > item.available;

          return (
            <div
              key={item.name}
              className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-default-200' : ''} ${isInsufficient ? 'border border-danger bg-danger/5 rounded-lg' : ''}`}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm text-foreground truncate">{item.name}</span>
                <span className={`text-xs ${isInsufficient ? 'text-danger' : 'text-default-400'}`}>
                  {t('simulado.availableQuestions', { count: item.available })}
                </span>
              </div>
              <Input
                className="w-20 shrink-0"
                classNames={{ inputWrapper: 'h-8' }}
                min={0}
                size="sm"
                type="number"
                value={String(currentCount)}
                variant="bordered"
                onValueChange={(v) => handleCountChange(item.name, v)}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button className={buttonStyles.primary} isDisabled={total === 0 || isGenerating} onPress={handleGenerate}>
          {t('generate.generateFullExam')}
        </Button>
      </div>
    </div>
  );
}
