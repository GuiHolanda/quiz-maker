'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListUl } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import {
  ensureMockExamAnswers,
  getMockExamAttemptResult,
  startMockExamAttempt,
  getExamQuestionExplanation,
} from '@/features/connectors';
import { MockExamResult } from '@/shared/types';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { buttonStyles } from '@/config/constants/buttonStyles';

import { ScorePanel } from './components/ScorePanel';
import { TopicPerformancePanel } from './components/TopicPerformancePanel';
import { QuestionReviewPanel } from './components/QuestionReviewPanel';
import { ComparisonPanel } from './components/ComparisonPanel';
import { NextStepPanel } from './components/NextStepPanel';
import { ResultSkeleton } from './components/ResultSkeleton';
import { deriveResult, formatFinishedAt } from './components/deriveResult';

export default function SimuladoResultadoPage() {
  const { t, language } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<MockExamResult | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getMockExamAttemptResult(Number(params.id), Number(params.attemptId));

      if (cancelled) return;

      const hasMissingAnswer = data.questions.some((mq) => !mq.examQuestion.answer);

      if (hasMissingAnswer) {
        try {
          await ensureMockExamAnswers(Number(params.id));
          const refreshed = await getMockExamAttemptResult(Number(params.id), Number(params.attemptId));

          if (!cancelled) setResult(refreshed);

          return;
        } catch {
          // fall back to whatever we already have — better partial than blank
        }
      }
      setResult(data);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [params.id, params.attemptId]);

  const breadcrumbs = (
    <Breadcrumbs>
      <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
      <BreadcrumbItem href="/simulados">{t('nav.simulados')}</BreadcrumbItem>
      <BreadcrumbItem>{t('nav.simuladoResult')}</BreadcrumbItem>
    </Breadcrumbs>
  );

  const allSimuladosAction = (
    <Button
      className={buttonStyles.secondary}
      startContent={<FontAwesomeIcon icon={faListUl} />}
      variant="bordered"
      onPress={() => router.push('/simulados')}
    >
      {t('simulado.result.allSimulados')}
    </Button>
  );

  if (!result) {
    return (
      <PageHeader breadcrumbs={breadcrumbs} subtitle={t('simulado.result.building')} title={t('simulado.scoreTitle')}>
        <ResultSkeleton />
      </PageHeader>
    );
  }

  const view = deriveResult(result);
  const finishedAt = formatFinishedAt(result.attempt.finishedAt, language);
  const subtitle =
    view.totalAttempts > 1
      ? t('simulado.result.subtitle', {
          date: finishedAt,
          total: view.total,
          n: view.attemptNumber,
          m: view.totalAttempts,
        })
      : t('simulado.result.subtitleNoAttempts', { date: finishedAt, total: view.total });

  async function handleTryAgain() {
    setIsStarting(true);
    try {
      const attempt = await startMockExamAttempt(Number(params.id));

      router.push(`/simulados/${params.id}/tentativa/${attempt.id}`);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <PageHeader
      action={allSimuladosAction}
      breadcrumbs={breadcrumbs}
      subtitle={subtitle}
      title={t('simulado.result.title', { exam: view.examName })}
    >
      <div className="flex flex-col gap-6">
        <ScorePanel view={view} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start xl:gap-8">
          <div className="flex min-w-0 flex-col gap-6">
            <TopicPerformancePanel view={view} />
            <QuestionReviewPanel view={view} onLoadExplanation={getExamQuestionExplanation} />
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <ComparisonPanel view={view} />
            <NextStepPanel isRetrying={isStarting} view={view} onRetry={handleTryAgain} />
          </div>
        </div>
      </div>
    </PageHeader>
  );
}
