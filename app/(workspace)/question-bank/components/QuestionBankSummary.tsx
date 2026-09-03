'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faCircleCheck, faLayerGroup, faLightbulb } from '@fortawesome/free-solid-svg-icons';

import { StatCard } from '@/shared/components/ui/StatCard';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { QuestionBankSummary as Summary } from '@/shared/types';

interface QuestionBankSummaryProps {
  readonly summary: Summary;
}

interface Card {
  readonly icon: IconDefinition;
  readonly label: string;
  readonly value: string;
  readonly suffix: string;
  readonly tone: 'default' | 'primary' | 'success';
}

export function QuestionBankSummary({ summary }: QuestionBankSummaryProps) {
  const { t } = useTranslation();

  const cards: Card[] = [
    {
      icon: faLayerGroup,
      label: t('questionBank.summarySaved'),
      value: String(summary.saved),
      suffix: t('questionBank.summarySavedSuffix'),
      tone: 'default',
    },
    {
      icon: faCircleCheck,
      label: t('questionBank.summaryAnswered'),
      value: String(summary.answered),
      suffix: t('questionBank.summaryAnsweredSuffix', { count: summary.saved }),
      tone: 'default',
    },
    {
      icon: faBullseye,
      label: t('questionBank.summaryAccuracy'),
      value: `${summary.accuracy}%`,
      suffix: t('questionBank.summaryAccuracySuffix', { correct: summary.correct, total: summary.attempts }),
      tone: summary.accuracy >= 70 ? 'success' : 'primary',
    },
    {
      icon: faLightbulb,
      label: t('questionBank.summaryNoExplanation'),
      value: String(summary.withoutExplanation),
      suffix: t('questionBank.summaryNoExplanationSuffix'),
      tone: summary.withoutExplanation > 0 ? 'primary' : 'default',
    },
  ];

  const toneClass = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
  } as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          icon={<FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5 text-navy-400/60" icon={card.icon} />}
          label={card.label}
          value={card.value}
          valueClassName={`font-mono text-3xl font-medium tracking-tight ${toneClass[card.tone]}`}
          suffix={card.suffix}
        />
      ))}
    </div>
  );
}
