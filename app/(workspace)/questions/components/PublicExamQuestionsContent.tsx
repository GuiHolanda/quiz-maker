'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Progress } from '@heroui/progress';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { faCircleCheck, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

import { GeneratedQuestionsList } from './GeneratedQuestionsList';
import { QuestionGeneratorForm } from './QuestionGeneratorForm';
import { FullExamDistributionTable } from './FullExamDistributionTable';

import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { AIPublicExamQuestion, PublicExamBrowseSummary, PublicExamQuestionParams } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTwoPhaseGeneration } from '@/features/hooks/useTwoPhaseGeneration.hook';
import { getPublicExamBrowseSummary, getPublicExamQuestions, savePublicExamQuestions } from '@/features/connectors';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useNotificationsContext } from '@/features/hooks/useNotificationsContext.hook';
import { notify } from '@/shared/lib/notify';

export function PublicExamQuestionsContent() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<AIPublicExamQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { publicExams, selectedPublicExam, selectedSubjects, selectedTopic, isLoading } = usePublicExamsContext();
  const { refreshUsage } = useUsageContext();
  const { loading: isSaving, request: requestSave } = useRequest(savePublicExamQuestions);
  const { addNotification } = useNotificationsContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullExamMode, setIsFullExamMode] = useState(false);
  const [pubBrowseSummary, setPubBrowseSummary] = useState<PublicExamBrowseSummary | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [batchDone, setBatchDone] = useState(false);
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
    [t]
  );

  const { isSecondPhaseLoading, generate, abort } = useTwoPhaseGeneration<
    PublicExamQuestionParams,
    AIPublicExamQuestion
  >({
    generateFn: getPublicExamQuestions,
    params: generationParams ?? { public_exam_name: '', exam_board_name: '', subject_name: '', num_questions: '5' },
    totalCount: generatingCount,
    onFirstBatch,
    onSecondBatch,
    onError: onGenerationError,
  });

  const remainingCount = Math.max(0, generatingCount - questions.length);

  const handleFormSubmit = (numQuestions: string) => {
    const selectedSubject = selectedSubjects[0];

    if (!selectedPublicExam) {
      notify.warning(t('toast.validationError'), t('error.publicExamRequired'));
      return;
    }
    if (!selectedSubject) {
      notify.warning(t('toast.validationError'), t('error.subjectRequired'));
      return;
    }

    const params: PublicExamQuestionParams = {
      public_exam_name: selectedPublicExam.name,
      exam_board_name: selectedPublicExam.examBoard?.name ?? '',
      subject_name: selectedSubject,
      topic_name: selectedTopic ?? undefined,
      num_questions: numQuestions,
    };

    setGeneratingCount(parseInt(numQuestions, 10) || 5);
    setGenerationParams(params);
    setIsGenerating(true);
    setShowHint(true);
  };

  useEffect(() => {
    if (generationParams && isGenerating) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationParams]);

  useEffect(() => {
    if (!isFullExamMode || !selectedPublicExam) return;
    getPublicExamBrowseSummary()
      .then(setPubBrowseSummary)
      .catch(() => {});
  }, [isFullExamMode, selectedPublicExam]);

  async function handleFullExamGenerate(subjectDistribution: Array<{ topicName: string; questionCount: number }>) {
    if (!selectedPublicExam) return;

    const validSubjects = subjectDistribution.filter((s) => s.questionCount > 0);
    if (validSubjects.length === 0) return;

    setIsBatchGenerating(true);
    setBatchDone(false);
    setBatchProgress({ completed: 0, total: validSubjects.length });

    const results = await Promise.allSettled(
      validSubjects.map(({ topicName: subjectName, questionCount }) =>
        getPublicExamQuestions({
          public_exam_name: selectedPublicExam.name,
          exam_board_name: selectedPublicExam.examBoard?.name ?? '',
          subject_name: subjectName,
          num_questions: String(questionCount),
        })
          .then((qs) => savePublicExamQuestions(qs).then(() => ({ subjectName, count: qs.length, ok: true as const })))
          .catch(() => ({ subjectName, count: 0, ok: false as const }))
          .finally(() => setBatchProgress((prev) => ({ ...prev, completed: prev.completed + 1 })))
      ),
    );

    const totalSaved = results
      .map((r) => (r.status === 'fulfilled' ? r.value.count : 0))
      .reduce((acc, c) => acc + c, 0);
    const successfulSubjects = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;

    setIsBatchGenerating(false);
    setBatchDone(true);
    refreshUsage();
    addNotification({
      title: t('notification.fullExamTitle'),
      description: t('notification.fullExamDescription', {
        certName: selectedPublicExam.name,
        total: totalSaved,
        topics: successfulSubjects,
      }),
      ctaLabel: t('generate.createSimulado'),
      ctaHref: '/simulados',
    });
  }

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
        <QuestionGeneratorForm
          fullExamSlot={renderFullExamSlot()}
          isFullExamMode={isFullExamMode}
          managerSlot={<PublicExamManager showTopic className="flex w-full gap-4 items-end" />}
          numQuestionsPlaceholderKey="concurso.numQuestionsPlaceholder"
          onFullExamModeChange={(enabled) => {
            setIsFullExamMode(enabled);
            setBatchDone(false);
            setBatchProgress({ completed: 0, total: 0 });
          }}
          onGenerationStart={handleFormSubmit}
        />
        {(isBatchGenerating || batchDone) && renderBatchProgress()}
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
    if (!selectedPublicExam || !pubBrowseSummary) {
      return (
        <p className="text-xs text-default-400 py-2">{t('concurso.selectPublicExamPlaceholder')}</p>
      );
    }

    const examData = pubBrowseSummary.publicExams.find((e) => e.id === selectedPublicExam.id);
    const subjects = examData?.subjects ?? [];

    if (subjects.length === 0) {
      return <p className="text-xs text-default-400 py-2">{t('simulado.noQuestionsTitle')}</p>;
    }

    return (
      <FullExamDistributionTable
        key={examData?.id ?? selectedPublicExam.id}
        items={subjects.map((s) => ({ name: s.name, available: s.questionCount, count: s.questionCount }))}
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
            total: batchProgress.completed,
            topics: batchProgress.total,
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
