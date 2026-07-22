'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Progress } from '@heroui/progress';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';

import { GeneratedQuestionsList } from './GeneratedQuestionsList';
import { QuestionGeneratorForm } from './QuestionGeneratorForm';

import useQuizContext from '@/features/hooks/useQuizContext.hook';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { AIQuestion, QuestionParams } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTwoPhaseGeneration } from '@/features/hooks/useTwoPhaseGeneration.hook';
import { getQuestions } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';

export function CertQuestionsContent() {
  const { t } = useTranslation();
  const { state, replaceQuiz, setAIquestions } = useQuizContext();
  const { certifications, isLoading } = useCertificationsContext();
  const { refreshUsage } = useUsageContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const [showSimuladosBanner, setShowSimuladosBanner] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [generationParams, setGenerationParams] = useState<QuestionParams | null>(null);

  const generatingStartRef = useRef<number>(0);

  useEffect(() => {
    if (!isGenerating) return;
    setProgress(0);
    generatingStartRef.current = Date.now();
    const estimatedMs = 8_000 + Math.min(5, generatingCount) * 1_200;
    const id = setInterval(() => {
      const ratio = (Date.now() - generatingStartRef.current) / estimatedMs;
      const target = 92 * (1 - Math.exp(-2.5 * ratio));
      setProgress((prev) => Math.max(prev, Math.min(target, 92)));
    }, 200);
    return () => clearInterval(id);
  }, [isGenerating, generatingCount]);

  const onFirstBatch = useCallback(
    (questions: AIQuestion[]) => {
      setProgress(100);
      setTimeout(() => {
        replaceQuiz({
          meta: { topic: questions[0]?.topic ?? '', num_questions: generatingCount },
          questions: [],
          answers: {},
          isFinished: false,
          aiQuestions: questions,
          selectedAIQuestions: [],
        });
        setAIquestions(questions, null);
        setIsGenerating(false);
      }, 350);
    },
    [replaceQuiz, setAIquestions, generatingCount],
  );

  const onSecondBatch = useCallback(
    (allQuestions: AIQuestion[]) => { setAIquestions(allQuestions, null); },
    [setAIquestions],
  );

  const onGenerationError = useCallback(
    (error: unknown, phase: 1 | 2) => {
      if (phase === 1) setIsGenerating(false);
      const err = error as { response?: { data?: { message?: string } } };
      notify.error(t('toast.failedToLoad'), err?.response?.data?.message ?? t('toast.somethingWrong'));
    },
    [t],
  );

  const { isSecondPhaseLoading, generate, abort } = useTwoPhaseGeneration<QuestionParams, AIQuestion>({
    generateFn: getQuestions,
    params: generationParams ?? { certification_name: '', topic_name: '', num_questions: '5' },
    totalCount: generatingCount,
    onFirstBatch,
    onSecondBatch,
    onError: onGenerationError,
  });

  const remainingCount = Math.max(0, generatingCount - (state?.aiQuestions?.length ?? 0));

  const onGenerationStart = (params: QuestionParams) => {
    setGeneratingCount(parseInt(params.num_questions, 10) || 5);
    setGenerationParams(params);
    setIsGenerating(true);
    setShowHint(true);
  };

  useEffect(() => {
    if (generationParams && isGenerating) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationParams]);

  return (
    <div className="flex w-full flex-col gap-4">
      {renderSimuladosBanner()}
      {renderContent()}
    </div>
  );

  function renderContent() {
    if (isLoading) return <SkeletonListLoader />;

    if (certifications.length === 0) {
      return (
        <EmptyState
          action={{ href: '/certifications/configure', label: t('certification.tabNew') }}
          description={t('certification.noCertificationsDescription')}
          title={t('certification.noCertificationsTitle')}
        />
      );
    }

    return (
      <>
        <QuestionGeneratorForm onGenerationStart={onGenerationStart} />
        {(isGenerating || (state?.aiQuestions?.length ?? 0) > 0) && renderSelectionHint()}
        {isGenerating && renderGenerationProgress()}
        {!isGenerating && (state?.aiQuestions?.length ?? 0) > 0 && (
          <GeneratedQuestionsList
            isLoadingMore={isSecondPhaseLoading}
            questions={state?.aiQuestions ?? []}
            remainingCount={remainingCount}
            onSaved={() => {
              abort();
              refreshUsage();
              setShowSimuladosBanner(true);
            }}
          />
        )}
      </>
    );
  }

  function renderSimuladosBanner() {
    if (!showSimuladosBanner) return null;
    return (
      <Card className="border border-success-200 bg-success-50 dark:bg-success-900/20 shadow-none">
        <CardBody className="flex flex-row items-center justify-between gap-3 py-3 px-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon className="text-success shrink-0" icon={faCircleCheck} />
            <p className="text-sm text-default-700">{t('generate.questionsReadyHint')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button as={Link} className={buttonStyles.secondary} href="/simulados" size="sm" variant="bordered">
              {t('generate.goToSimulados')}
            </Button>
            <Button
              isIconOnly
              aria-label={t('common.dismiss')}
              className={buttonStyles.iconOnly.neutral}
              size="sm"
              variant="light"
              onPress={() => setShowSimuladosBanner(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  function renderGenerationProgress() {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <Progress
          aria-label={t('busy.generating')}
          classNames={{ label: 'text-xs font-extrabold', value: 'text-xs font-extrabold' }}
          color="primary"
          label={progress < 75 ? t('busy.generating') : t('busy.almostDone')}
          showValueLabel
          size="sm"
          value={progress}
        />
        {progress >= 75 && <SkeletonListLoader count={Math.min(5, generatingCount)} height="h-24" />}
      </div>
    );
  }

  function renderSelectionHint() {
    if (!showHint) return null;
    return (
      <Card className="bg-primary-50/60 dark:bg-primary-900/20 shadow-none">
        <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
          <FontAwesomeIcon className="text-primary mt-0.5 shrink-0" icon={faCircleInfo} />
          <p className="text-xs text-default-700 flex-1">{t('generate.selectionHint')}</p>
          <Button
            isIconOnly
            aria-label={t('common.dismiss')}
            className={buttonStyles.iconOnly.neutral}
            size="sm"
            variant="light"
            onPress={() => setShowHint(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </CardBody>
      </Card>
    );
  }
}
