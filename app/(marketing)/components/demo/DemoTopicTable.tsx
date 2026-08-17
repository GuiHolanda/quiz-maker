'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintFrame } from '@/app/(marketing)/components/shared/BlueprintFrame';
import { DemoProgressBar } from './DemoProgressBar';
import type { TopicMastery, TopicResult } from './demoDiagnosis';

interface DemoTopicTableProps {
  readonly topics: readonly TopicResult[];
}

const MASTERY_LABEL_KEY: Record<TopicMastery, string> = {
  mastered: 'demo.step4.topicDomina',
  shaky: 'demo.step4.topicInstavel',
  priority: 'demo.step4.topicPrioridade',
};

const MASTERY_TEXT_CLASS: Record<TopicMastery, string> = {
  mastered: 'text-mkt-accent',
  shaky: 'text-mkt-text opacity-60',
  priority: 'text-orange-500',
};

const MASTERY_BAR_CLASS: Record<TopicMastery, string> = {
  mastered: 'bg-mkt-accent',
  shaky: 'bg-mkt-accent/30',
  priority: 'bg-mkt-accent/30',
};

export function DemoTopicTable({ topics }: DemoTopicTableProps) {
  const { t } = useTranslation();

  return (
    <BlueprintFrame>
      <div className="px-5 py-4 border-b border-mkt-divider flex items-center justify-between">
        <span className="ds-heading text-mkt-text text-lg font-bold">{t('demo.step4.topicsHeading')}</span>
        <span className="mono text-xs text-mkt-text opacity-40">{t('demo.step4.topicsSortLabel')}</span>
      </div>

      {topics.map((item) => (
        <div key={item.topic} className="px-5 py-4 border-b border-mkt-divider last:border-b-0 flex items-center gap-3">
          <span className="text-base text-mkt-text flex-1 min-w-0 truncate">{item.topic}</span>
          <DemoProgressBar
            pct={item.pct}
            barColor={MASTERY_BAR_CLASS[item.mastery]}
            className="w-32 h-1.5 flex-shrink-0"
          />
          <span className="mono text-xs text-mkt-text opacity-60 w-10 text-right flex-shrink-0">
            {item.correct}/{item.total}
          </span>
          <span className={`mono text-xs flex-shrink-0 ${MASTERY_TEXT_CLASS[item.mastery]}`}>
            {t(MASTERY_LABEL_KEY[item.mastery])}
          </span>
        </div>
      ))}
    </BlueprintFrame>
  );
}
