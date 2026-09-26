'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { EXAM_CARD_ACTIONS } from './examCardActions';
import { readinessNote } from './examReadinessNote';

import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { readinessBar, readinessTone } from '@/shared/lib/examReadiness';
import { toneText } from '@/shared/lib/scoreTone';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { Exam } from '@/shared/types';

interface ExamCardReadinessProps {
  readonly exam: Exam;
}

export function ExamCardReadiness({ exam }: ExamCardReadinessProps) {
  const { t } = useTranslation();
  const passingScore = exam.passingScore ?? null;
  const bar = readinessBar(exam.readiness, passingScore);
  const note = readinessNote(exam);
  const action = note.action ? EXAM_CARD_ACTIONS[note.action] : null;

  return (
    <div data-testid="exam-card-readiness">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-default-400">{t('exam.readinessLabel')}</span>
        {renderValue()}
      </div>
      <ProgressTrack
        className="mt-2"
        fillClass={bar.fillClass}
        heightClass="h-[7px]"
        markerPercent={bar.markerPercent}
        trackClass="bg-background"
        value={bar.value}
      />
      <p className="mt-2 text-xs text-navy-500 leading-snug">{t(note.key, note.params)}</p>
      {action && (
        <Button
          as={NextLink}
          className={`${buttonStyles.primaryFlat} mt-2.5`}
          data-testid="exam-card-readiness-action"
          href={action.href(exam.id)}
          size="sm"
          startContent={<FontAwesomeIcon aria-hidden="true" className="w-3 h-3" icon={action.icon} />}
        >
          {t(action.labelKey)}
        </Button>
      )}
    </div>
  );

  function renderValue() {
    const readiness = exam.readiness;

    if (!readiness || readiness.phase === 'no_sections') return null;

    if (readiness.phase === 'measured') {
      const projected = readiness.projectedPercent ?? 0;

      return (
        <span className={`font-mono text-sm ${toneText(readinessTone(projected, passingScore))}`}>{projected}%</span>
      );
    }

    if (readiness.phase === 'ready_to_measure') {
      return <span className="text-xs font-semibold text-foreground">{t('exam.readinessReadyValue')}</span>;
    }

    return (
      <span className="font-mono text-sm text-foreground">
        {t('exam.readinessBankValue', { covered: readiness.coveredQuestions, target: readiness.targetQuestions })}
      </span>
    );
  }
}
