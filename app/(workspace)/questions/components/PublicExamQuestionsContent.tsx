'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Progress } from '@heroui/progress';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';

import { GeneratedQuestionsList } from './GeneratedQuestionsList';
import { PublicExamQuestionGeneratorForm } from './PublicExamQuestionGeneratorForm';

import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { AIPublicExamQuestion, PublicExamQuestionParams } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTwoPhaseGeneration } from '@/features/hooks/useTwoPhaseGeneration.hook';
import { getPublicExamQuestions, savePublicExamQuestions } from '@/features/connectors';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { notify } from '@/shared/lib/notify';

export function PublicExamQuestionsContent() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<AIPublicExamQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { publicExams, isLoading } = usePublicExamsContext();
  const { refreshUsage } = useUsageContext();
  const { loading: isSaving, request: requestSave } = useRequest(savePublicExamQuestions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const [showSimuladosBanner, setShowSimuladosBanner] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [generationParams, setGenerationParams] = useState<PublicExamQuestionParams | null>(null);

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

  const onFirstBatch = useCallback((batch: AIPublicExamQuestion[]) => {
    setProgress(100);
    setTimeout(() => {
      setQuestions(batch);
      setIsGenerating(false);
    }, 350);
  }, []);

  const onSecondBatch = useCallback((allQuestions: AIPublicExamQuestion[]) => {
    setQuestions(allQuestions);
  }, []);

  const onGenerationError = useCallback(
    (error: unknown, phase: 1 | 2) => {
      if (phase === 1) setIsGenerating(false);
      const err = error as { response?: { data?: { message?: string } } };
      notify.error(t('toast.failedToLoad'), err?.response?.data?.message ?? t('toast.somethingWrong'));
    },
    [t],
  );

  const { isSecondPhaseLoading, generate, abort } = useTwoPhaseGeneration<PublicExamQuestionParams, AIPublicExamQuestion>({
    generateFn: getPublicExamQuestions,
    params: generationParams ?? { public_exam_name: '', exam_board_name: '', subject_name: '', num_questions: '5' },
    totalCount: generatingCount,
    onFirstBatch,
    onSecondBatch,
    onError: onGenerationError,
  });

  const remainingCount = Math.max(0, generatingCount - questions.length);

  const onGenerationStart = (params: PublicExamQuestionParams) => {
    setGeneratingCount(parseInt(params.num_questions, 10) || 5);
    setGenerationParams(params);
    setIsGenerating(true);
    setShowHint(true);
  };

  useEffect(() => {
    if (generationParams && isGenerating) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationParams]);

  const onSave = async () => {
    const questionsToSave = selectedIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as AIPublicExamQuestion[];

    await requestSave(questionsToSave, () => {
      notify.success(t('toast.success'), t('toast.publicExamQuestionsSaved', { count: questionsToSave.length }));
      setSelectedIds([]);
      setQuestions([]);
      abort();
      refreshUsage();
      setShowSimuladosBanner(true);
    });
  };

  const onDiscard = () => {
    if (selectedIds.length > 0) {
      const remaining = questions.filter((q) => !selectedIds.includes(q.id));

      setSelectedIds([]);
      setQuestions(remaining);
    } else {
      setSelectedIds([]);
      setQuestions([]);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {renderSimuladosBanner()}
      {renderContent()}
    </div>
  );

  function renderContent() {
    if (isLoading) return <SkeletonListLoader />;

    if (publicExams.length === 0) {
      return (
        <EmptyState
          action={{ href: '/public-exams/configure', label: t('concurso.tabNew') }}
          description={t('concurso.noExamsDescription')}
          title={t('concurso.noExamsTitle')}
        />
      );
    }

    return (
      <>
        <PublicExamQuestionGeneratorForm onGenerationStart={onGenerationStart} />
        {(isGenerating || questions.length > 0) && renderSelectionHint()}
        {isGenerating && renderGenerationProgress()}
        {!isGenerating && questions.length > 0 && (
          <GeneratedQuestionsList
            isLoadingMore={isSecondPhaseLoading}
            isSaving={isSaving}
            questions={questions}
            remainingCount={remainingCount}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onDiscard={onDiscard}
            onSave={onSave}
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
      <Card className="border border-primary-100 bg-primary-50/60 dark:bg-primary-900/20 shadow-none">
        <CardBody className="flex flex-row items-start gap-3 py-3 px-4">
          <FontAwesomeIcon className="text-primary mt-0.5 shrink-0" icon={faCircleInfo} />
          <p className="text-xs text-default-700 flex-1">{t('generate.selectionHint')}</p>
          <Button
            isIconOnly
            aria-label={t('common.dismiss')}
            className={`${buttonStyles.iconOnly.neutral} shrink-0`}
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
