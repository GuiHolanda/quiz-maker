'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListUl, faRotateRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { startMockExamAttempt, getExamQuestionExplanation } from '@/features/connectors';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { WorkspaceSplitLayout } from '@/shared/components/ui/WorkspaceSplitLayout';
import { buttonStyles } from '@/config/constants/buttonStyles';

import { ScorePanel } from './components/ScorePanel';
import { TopicPerformancePanel } from './components/TopicPerformancePanel';
import { QuestionReviewPanel } from './components/QuestionReviewPanel';
import { ComparisonPanel } from './components/ComparisonPanel';
import { NextStepPanel } from './components/NextStepPanel';
import { ResultSkeleton } from './components/ResultSkeleton';
import { deriveResult, formatFinishedAt } from './components/deriveResult';
import { useAttemptResult } from './components/useAttemptResult.hook';

export default function SimuladoResultadoPage() {
  const { t, language } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const { result, loadFailed, reload } = useAttemptResult(Number(params.id), Number(params.attemptId));
  const [isStarting, setIsStarting] = useState(false);

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

  if (loadFailed) {
    return (
      <PageHeader breadcrumbs={breadcrumbs} title={t('simulado.scoreTitle')}>
        <EmptyState
          action={{ label: t('common.retry'), icon: faRotateRight, onPress: reload }}
          description={t('simulado.result.loadErrorBody')}
          title={t('simulado.result.loadErrorTitle')}
        />
      </PageHeader>
    );
  }

  if (!result) {
    return (
      <PageHeader breadcrumbs={breadcrumbs} subtitle={t('simulado.result.building')} title={t('simulado.scoreTitle')}>
        <ResultSkeleton />
      </PageHeader>
    );
  }

  const view = deriveResult(result);
  const isFullyGraded = view.ungradedCount === 0;

  const headerAction = (
    <div className="flex items-center gap-3">
      {view.timedOut && (
        <Chip color="warning" size="sm" variant="flat">
          {t('simulado.result.timedOut')}
        </Chip>
      )}
      {allSimuladosAction}
    </div>
  );

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

  const review = (
    <QuestionReviewPanel
      attemptId={Number(params.attemptId)}
      view={view}
      onLoadExplanation={getExamQuestionExplanation}
    />
  );

  return (
    <PageHeader
      action={headerAction}
      breadcrumbs={breadcrumbs}
      subtitle={subtitle}
      title={t('simulado.result.title', { exam: view.examName })}
    >
      <div className="flex flex-col gap-6">
        {isFullyGraded ? (
          <>
            <ScorePanel view={view} />

            <WorkspaceSplitLayout
              stickyRail
              rail={
                <>
                  <ComparisonPanel view={view} />
                  <NextStepPanel isRetrying={isStarting} view={view} onRetry={handleTryAgain} />
                </>
              }
            >
              <TopicPerformancePanel view={view} />
              {review}
            </WorkspaceSplitLayout>
          </>
        ) : (
          <>
            <EmptyState
              action={{ label: t('common.retry'), icon: faRotateRight, onPress: reload }}
              description={t('simulado.result.ungradedBody')}
              title={t(
                view.ungradedCount === 1 ? 'simulado.result.ungradedTitle' : 'simulado.result.ungradedTitlePlural',
                { count: view.ungradedCount }
              )}
            />
            {review}
          </>
        )}
      </div>
    </PageHeader>
  );
}
