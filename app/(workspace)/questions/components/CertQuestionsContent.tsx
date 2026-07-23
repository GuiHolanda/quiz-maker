'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Progress } from '@heroui/progress';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { faCircleCheck, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

import { GeneratedQuestionsList } from './GeneratedQuestionsList';
import { QuestionGeneratorForm } from './QuestionGeneratorForm';

import useQuizContext from '@/features/hooks/useQuizContext.hook';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { CertificationManager } from '@/shared/components/CertificationManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { AIQuestion, BrowseSummary, QuestionParams } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTwoPhaseGeneration } from '@/features/hooks/useTwoPhaseGeneration.hook';
import { getQuestions, saveQuestions, getBrowseSummary } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useNotificationsContext } from '@/features/hooks/useNotificationsContext.hook';
import { FullExamDistributionTable } from './FullExamDistributionTable';

export function CertQuestionsContent() {
  const { t } = useTranslation();
  const { state, replaceQuiz, setAIquestions, setSelectedAIquestions } = useQuizContext();
  const { certifications, selectedCertification, selectedTopics, isLoading } = useCertificationsContext();
  const { refreshUsage } = useUsageContext();
  const { loading: isSaving, request: requestSave } = useRequest(saveQuestions);
  const { addNotification } = useNotificationsContext();
  const [isFullExamMode, setIsFullExamMode] = useState(false);
  const [browseSummary, setBrowseSummary] = useState<BrowseSummary | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [batchDone, setBatchDone] = useState(false);
  const [batchResult, setBatchResult] = useState({ saved: 0, successfulTopics: 0 });
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

  const aiQuestions = state?.aiQuestions ?? [];
  const selectedIds = state?.selectedAIQuestions ?? [];
  const remainingCount = Math.max(0, generatingCount - aiQuestions.length);

  const handleFormSubmit = (numQuestions: string) => {
    const selectedTopic = selectedTopics[0];

    if (!selectedCertification) {
      notify.warning(t('toast.validationError'), t('error.certificationTitleRequired'));
      return;
    }
    if (!selectedTopic) {
      notify.warning(t('toast.validationError'), t('error.topicRequired'));
      return;
    }

    const params: QuestionParams = {
      certification_name: selectedCertification.label,
      topic_name: selectedTopic,
      num_questions: numQuestions,
    };

    setGeneratingCount(parseInt(numQuestions, 10) || 5);
    setGenerationParams(params);
    setIsGenerating(true);
    setShowHint(true);
  };

  async function handleFullExamGenerate(topicDistribution: Array<{ topicName: string; questionCount: number }>) {
    if (!selectedCertification) return;

    const validTopics = topicDistribution.filter((entry) => entry.questionCount > 0);
    if (validTopics.length === 0) return;

    setIsBatchGenerating(true);
    setBatchDone(false);
    setBatchProgress({ completed: 0, total: validTopics.length });

    const results = await Promise.allSettled(
      validTopics.map(({ topicName, questionCount }) =>
        getQuestions({
          certification_name: selectedCertification.label,
          topic_name: topicName,
          num_questions: String(questionCount),
        })
          .then((questions) => saveQuestions(questions).then(() => ({ topicName, count: questions.length, ok: true as const })))
          .catch(() => ({ topicName, count: 0, ok: false as const }))
          .finally(() => setBatchProgress((prev) => ({ ...prev, completed: prev.completed + 1 })))
      ),
    );

    const totalSaved = results
      .map((r) => (r.status === 'fulfilled' ? r.value.count : 0))
      .reduce((acc, c) => acc + c, 0);
    const successfulTopics = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;

    setIsBatchGenerating(false);
    setBatchDone(true);
    setBatchResult({ saved: totalSaved, successfulTopics });
    refreshUsage();
    addNotification({
      title: t('notification.fullExamTitle'),
      description: t('notification.fullExamDescription', {
        certName: selectedCertification.label,
        total: totalSaved,
        topics: successfulTopics,
      }),
      ctaLabel: t('generate.createSimulado'),
      ctaHref: '/simulados',
    });
  }

  useEffect(() => {
    if (generationParams && isGenerating) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationParams]);

  useEffect(() => {
    if (!selectedCertification) return;
    getBrowseSummary()
      .then(setBrowseSummary)
      .catch(() => {});
  }, [selectedCertification]);

  const onSave = async () => {
    const questionsToSave = selectedIds
      .map((id) => aiQuestions.find((q) => q.id === id))
      .filter(Boolean) as AIQuestion[];

    await requestSave(questionsToSave, () => {
      setSelectedAIquestions([]);
      setAIquestions([], null);
      abort();
      refreshUsage();
      setShowSimuladosBanner(true);
    });
  };

  const onDiscard = () => {
    if (selectedIds.length > 0) {
      const remaining = aiQuestions.filter((q) => !selectedIds.includes(q.id));

      setSelectedAIquestions([]);
      setAIquestions(remaining, null);
    } else {
      setSelectedAIquestions([]);
      setAIquestions([], null);
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

    if (certifications.length === 0) {
      return (
        <EmptyState
          action={{ href: '/certifications/configure', label: t('certification.tabNew') }}
          description={t('certification.noCertificationsDescription')}
          title={t('certification.noCertificationsTitle')}
        />
      );
    }

    const isFullExamModeDisabled = !selectedCertification || selectedCertification.totalQuestions === 0;

    return (
      <>
        <QuestionGeneratorForm
          fullExamSlot={renderFullExamSlot()}
          isFullExamMode={isFullExamMode}
          isFullExamModeDisabled={isFullExamModeDisabled}
          managerSlot={<CertificationManager noTopics className="w-full" />}
          topicSlot={<CertificationManager topicOnly className="w-full" />}
          onFullExamModeChange={(enabled) => {
            setIsFullExamMode(enabled);
            setBatchDone(false);
            setBatchProgress({ completed: 0, total: 0 });
          }}
          onGenerationStart={handleFormSubmit}
        />
        {(isBatchGenerating || batchDone) && renderBatchProgress()}
        {(isGenerating || aiQuestions.length > 0) && renderSelectionHint()}
        {isGenerating && renderGenerationProgress()}
        {!isGenerating && aiQuestions.length > 0 && (
          <GeneratedQuestionsList
            isLoadingMore={isSecondPhaseLoading}
            isSaving={isSaving}
            questions={aiQuestions}
            remainingCount={remainingCount}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedAIquestions}
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
      <InlineAlert
        color="success"
        icon={faCircleCheck}
        title={t('generate.questionsReadyHint')}
        endContent={
          <Button as={Link} className={buttonStyles.secondary} href="/simulados" size="sm" variant="bordered">
            {t('generate.goToSimulados')}
          </Button>
        }
        onDismiss={() => setShowSimuladosBanner(false)}
      />
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
      <InlineAlert
        color="primary"
        icon={faCircleInfo}
        title={t('generate.selectionHint')}
        onDismiss={() => setShowHint(false)}
      />
    );
  }

  function renderFullExamSlot() {
    if (!selectedCertification || !browseSummary) {
      return (
        <p className="text-xs text-default-400 py-2">{t('certification.selectCertificationPlaceholder')}</p>
      );
    }

    const certData = browseSummary.certifications.find((c) => c.key === selectedCertification.key);
    const topics = certData?.topics ?? [];

    if (topics.length === 0) {
      return <p className="text-xs text-default-400 py-2">{t('simulado.noQuestionsTitle')}</p>;
    }

    const totalTarget = selectedCertification.totalQuestions;
    const totalMaxWeight = selectedCertification.topics.reduce((acc, topic) => acc + topic.maxQuestions, 0);

    const distributedItems = topics.map((topic) => {
      const certTopic = selectedCertification.topics.find((ct) => ct.name === topic.name);
      const weight = certTopic?.maxQuestions ?? 0;
      const count = totalMaxWeight > 0 ? Math.round((weight / totalMaxWeight) * totalTarget) : 0;

      return { name: topic.name, available: topic.questionCount, count: Math.min(count, topic.questionCount) };
    });

    return (
      <FullExamDistributionTable
        key={certData?.key ?? selectedCertification.key}
        isGenerating={isBatchGenerating}
        items={distributedItems}
        onGenerate={handleFullExamGenerate}
      />
    );
  }

  function renderBatchProgress() {
    if (batchDone) {
      return (
        <InlineAlert
          color="success"
          icon={faCircleCheck}
          title={t('generate.fullExamComplete')}
          description={t('generate.fullExamCompleteDescription', {
            total: batchResult.saved,
            topics: batchResult.successfulTopics,
          })}
        />
      );
    }

    return (
      <InlineAlert
        color="warning"
        title={t('generate.generatingFullExam')}
        description={t('generate.generatingProgress', {
          completed: batchProgress.completed,
          total: batchProgress.total,
        })}
      />
    );
  }
}
