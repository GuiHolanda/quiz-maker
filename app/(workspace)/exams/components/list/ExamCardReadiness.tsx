'use client';

import NextLink from 'next/link';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { readinessNote, type ReadinessNoteAction } from './examReadinessNote';

import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { readinessBar, readinessTone } from '@/shared/lib/examReadiness';
import { toneText } from '@/shared/lib/scoreTone';
import type { Exam } from '@/shared/types';

interface ExamCardReadinessProps {
  readonly exam: Exam;
}

const ACTION_LABEL_KEY: Record<ReadinessNoteAction, string> = {
  generate: 'exam.actionGenerate',
  simulado: 'exam.actionCreateSimulado',
};

const ACTION_PATH: Record<ReadinessNoteAction, string> = {
  generate: '/questions',
  simulado: '/simulados',
};

export function ExamCardReadiness({ exam }: ExamCardReadinessProps) {
  const { t } = useTranslation();
  const passingScore = exam.passingScore ?? null;
  const bar = readinessBar(exam.readiness, passingScore);
  const note = readinessNote(exam);

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
      {note.action && (
        <NextLink
          className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          data-testid="exam-card-readiness-action"
          href={`${ACTION_PATH[note.action]}?examId=${exam.id}`}
        >
          {t(ACTION_LABEL_KEY[note.action])}
          <FontAwesomeIcon className="text-[10px]" icon={faArrowRight} />
        </NextLink>
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
