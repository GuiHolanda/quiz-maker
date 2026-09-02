'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faCircleCheck, faLayerGroup, faLightbulb } from '@fortawesome/free-solid-svg-icons';

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
        <div key={card.label} className="bg-content1 rounded-xl p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-navy-400/60">
            <FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5" icon={card.icon} />
            {card.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-medium tracking-tight ${toneClass[card.tone]}`}>
              {card.value}
            </span>
            <span className="text-sm text-default-500">{card.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
