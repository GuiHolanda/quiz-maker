'use client';

import { useMemo } from 'react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoCatalogExam, DemoQuestion } from '@/shared/types';
import { DemoProgressBar } from './DemoProgressBar';
import { DemoStepHeader } from './DemoStepHeader';
import { DemoStatCard } from './DemoStatCard';
import { DemoTopicTable } from './DemoTopicTable';
import { DemoQuestionReview } from './DemoQuestionReview';
import { DemoResultActions } from './DemoResultActions';
import { buildDiagnosis, parsePassingPct } from './demoDiagnosis';

interface DemoStep4DiagnosisProps {
  readonly exam: DemoCatalogExam;
  readonly questions: DemoQuestion[];
  readonly answers: Record<string, number[]>;
  readonly onRestart: () => void;
}

const WEAK_TOPICS_PREVIEW = 2;

export function DemoStep4Diagnosis({ exam, questions, answers, onRestart }: DemoStep4DiagnosisProps) {
  const { t } = useTranslation();

  const diagnosis = useMemo(
    () => buildDiagnosis(questions, answers, parsePassingPct(exam.passing)),
    [questions, answers, exam.passing]
  );

  const { hits, total, errors, scorePct, passingPct, passed, results, topics, weakTopics } = diagnosis;

  const weakPreview = weakTopics
    .slice(0, WEAK_TOPICS_PREVIEW)
    .map((item) => item.topic)
    .join(' · ');
  const weakOverflow = weakTopics.length > WEAK_TOPICS_PREVIEW ? ` · +${weakTopics.length - WEAK_TOPICS_PREVIEW}` : '';

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <DemoStepHeader kick={t('demo.step4.kick')} heading={t('demo.step4.heading')} note={exam.name} />
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <DemoStatCard
          label={t('demo.step4.statScore')}
          value={`${scorePct}%`}
          accent={passed}
          footer={passed ? t('demo.step4.passed') : t('demo.step4.failed')}
        >
          <DemoProgressBar pct={scorePct} className="mt-2 h-1" />
        </DemoStatCard>

        <DemoStatCard
          label={t('demo.step4.statHits')}
          value={`${hits}/${total}`}
          footer={`${errors} ${errors === 1 ? t('demo.step4.statHitsError') : t('demo.step4.statHitsErrors')}`}
        />

        <DemoStatCard
          label={t('demo.step4.statCutline')}
          value={`${passingPct}%`}
          footer={t('demo.step4.cutlineLabel', { pct: passingPct })}
        />

        <DemoStatCard
          label={t('demo.step4.statWeak')}
          value={weakTopics.length}
          footer={`${weakPreview}${weakOverflow}`}
        />
      </div>

      {/* The analysis column carries tables and question text, so it takes two
          thirds; the CTA cards only hold short copy and a button. */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6 min-w-0 lg:col-span-2">
          <DemoTopicTable topics={topics} />
          <DemoQuestionReview questions={questions} answers={answers} results={results} />
        </div>

        <DemoResultActions onRestart={onRestart} />
      </div>
    </div>
  );
}
