'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Progress } from '@heroui/progress';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import Link from 'next/link';
import { faCircleCheck, faCircleInfo, faCircleXmark, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { GeneratedQuestionsList } from './GeneratedQuestionsList';
import { QuestionGeneratorForm } from './QuestionGeneratorForm';
import { FullExamDistributionTable } from './FullExamDistributionTable';

import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { AIPublicExamQuestion, FullExamJobTopicStatus, PublicExamBrowseSummary, PublicExamQuestionParams } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';
import { useTwoPhaseGeneration } from '@/features/hooks/useTwoPhaseGeneration.hook';
import {
  getPublicExamBrowseSummary,
  getPublicExamQuestions,
  savePublicExamQuestions,
  createFullExamJob,
  getActiveFullExamJob,
  cancelFullExamJob,
} from '@/features/connectors';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useNotificationsContext } from '@/features/hooks/useNotificationsContext.hook';
import { notify } from '@/shared/lib/notify';

function distributeByWeight(items: Array<{ name: string; weight: number }>, total: number): Array<{ name: string; count: number }> {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  if (totalWeight === 0 || total === 0) return items.map((item) => ({ name: item.name, count: 0 }));

  const exactValues = items.map((item) => ({ name: item.name, exact: (item.weight / totalWeight) * total }));
  const floors = exactValues.map((item) => ({ name: item.name, count: Math.floor(item.exact), remainder: item.exact - Math.floor(item.exact) }));
  const remaining = total - floors.reduce((acc, item) => acc + item.count, 0);

  return floors
    .map((item, i) => ({ ...item, i }))
    .sort((a, b) => b.remainder - a.remainder)
    .map((item, rank) => ({ name: item.name, count: item.count + (rank < remaining ? 1 : 0) }))
    .sort((a, b) => floors.findIndex((f) => f.name === a.name) - floors.findIndex((f) => f.name === b.name));
}

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
  const [batchResult, setBatchResult] = useState({ saved: 0, successfulTopics: 0 });
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchTopics, setBatchTopics] = useState<FullExamJobTopicStatus[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
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
    if (!selectedPublicExam) return;
    getPublicExamBrowseSummary()
      .then(setPubBrowseSummary)
      .catch(() => {});
  }, [selectedPublicExam]);

  useEffect(() => {
    if (!selectedPublicExam?.id) return;
    getActiveFullExamJob({ type: 'public_exam', refKey: selectedPublicExam.id }).then((job) => {
      if (job && job.status === 'running') {
        setIsBatchGenerating(true);
        setBatchProgress({ completed: job.doneTopics, total: job.totalTopics });
        if (job.topics) setBatchTopics(job.topics);
        setBatchJobId(job.id);
        connectToJobStream(job.id);
      }
    });
  }, [selectedPublicExam?.id]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const connectToJobStream = useCallback(
    (jobId: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      const es = new EventSource(`/api/full-exam-job/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data) as { doneTopics: number; totalTopics: number; topics?: FullExamJobTopicStatus[] };
        setBatchProgress({ completed: data.doneTopics, total: data.totalTopics });
        if (data.topics) setBatchTopics(data.topics);
      });

      es.addEventListener('done', (e) => {
        const data = JSON.parse(e.data) as {
          doneTopics: number;
          totalTopics: number;
          savedCount: number;
          topics?: FullExamJobTopicStatus[];
        };
        es.close();
        eventSourceRef.current = null;
        setIsBatchGenerating(false);
        setBatchDone(true);
        setBatchResult({ saved: data.savedCount, successfulTopics: data.doneTopics });
        if (data.topics) setBatchTopics(data.topics);
        refreshUsage();
        if (selectedPublicExam) {
          try {
            localStorage.setItem(
              SIMULADO_NEW_PREFILL_KEY,
              JSON.stringify({
                type: 'public_exam',
                examId: selectedPublicExam.id,
                totalQuestions: selectedPublicExam.totalQuestions,
              }),
            );
          } catch {}
          addNotification({
            title: t('notification.fullExamTitle'),
            description: t('notification.fullExamDescription', {
              certName: selectedPublicExam.name,
              total: data.savedCount,
              topics: data.doneTopics,
            }),
            ctaLabel: t('generate.createSimulado'),
            ctaHref: '/simulados?tab=new',
          });
        }
      });

      es.addEventListener('error', () => {
        es.close();
        eventSourceRef.current = null;
        setIsBatchGenerating(false);
      });
    },
    [selectedPublicExam, addNotification, t, refreshUsage],
  );

  async function handleFullExamGenerate(subjectDistribution: Array<{ topicName: string; questionCount: number }>) {
    if (!selectedPublicExam) return;
    const validSubjects = subjectDistribution.filter((entry) => entry.questionCount > 0);
    if (validSubjects.length === 0) return;

    setIsBatchGenerating(true);
    setBatchDone(false);
    setBatchProgress({ completed: 0, total: validSubjects.length });

    try {
      const { jobId } = await createFullExamJob({
        type: 'public_exam',
        refKey: selectedPublicExam.id!,
        refName: selectedPublicExam.name,
        examBoardName: selectedPublicExam.examBoard?.name,
        distribution: validSubjects,
      });
      setBatchJobId(jobId);
      connectToJobStream(jobId);
    } catch {
      setIsBatchGenerating(false);
    }
  }

  async function handleCancelBatch() {
    if (!batchJobId) return;
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsBatchGenerating(false);
    try {
      await cancelFullExamJob(batchJobId);
    } catch {}
    setBatchJobId(null);
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
          isFullExamModeDisabled={!selectedPublicExam || selectedPublicExam.totalQuestions === 0}
          managerSlot={<PublicExamManager noSubjects className="w-full" />}
          numQuestionsPlaceholderKey="concurso.numQuestionsPlaceholder"
          topicSlot={<PublicExamManager subjectOnly showTopic className="flex w-full gap-4 items-end" />}
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
    if (!selectedPublicExam) {
      return (
        <p className="text-xs text-default-400 py-2">{t('concurso.selectPublicExamPlaceholder')}</p>
      );
    }

    const totalTarget = selectedPublicExam.totalQuestions;

    // Use saved-questions data if available, otherwise fall back to the exam's configured subjects
    const examData = pubBrowseSummary?.publicExams.find((e) => e.id === selectedPublicExam.id);
    const hasSavedSubjects = (examData?.subjects.length ?? 0) > 0;

    const distributedItems = hasSavedSubjects
      ? distributeByWeight(
          examData!.subjects.map((subject) => {
            const examSubject = selectedPublicExam.subjects.find((s) => s.name === subject.name);
            return { name: subject.name, weight: examSubject?.maxQuestions ?? 0 };
          }),
          totalTarget,
        )
      : distributeByWeight(
          selectedPublicExam.subjects.map((subject) => ({ name: subject.name, weight: subject.maxQuestions })),
          totalTarget,
        );

    if (distributedItems.length === 0) {
      return <p className="text-xs text-default-400 py-2">{t('simulado.noQuestionsTitle')}</p>;
    }

    return (
      <FullExamDistributionTable
        key={examData?.id ?? selectedPublicExam.id}
        isGenerating={isBatchGenerating}
        items={distributedItems}
        onGenerate={handleFullExamGenerate}
      />
    );
  }

  function renderBatchProgress() {
    const topicList = batchTopics.length > 0 ? (
      <div className="flex flex-col gap-1 mt-2">
        {batchTopics.map((topic) => {
          const icon =
            topic.status === 'done' ? faCircleCheck :
            topic.status === 'error' ? faCircleXmark :
            topic.status === 'running' ? faCircleNotch :
            null;
          const color =
            topic.status === 'done' ? 'text-success' :
            topic.status === 'error' ? 'text-danger' :
            topic.status === 'running' ? 'text-warning' :
            'text-default-400';

          return (
            <div key={topic.id} className="flex items-start gap-2 text-xs">
              {icon ? (
                <FontAwesomeIcon
                  className={`w-3 h-3 mt-0.5 shrink-0 ${color} ${topic.status === 'running' ? 'animate-spin' : ''}`}
                  icon={icon}
                />
              ) : (
                <span className="w-3 h-3 mt-0.5 shrink-0 rounded-full border border-default-300 inline-block" />
              )}
              <span className={topic.status === 'error' ? 'text-danger' : 'text-default-500'}>
                {topic.topicName}
                {topic.status === 'done' && <span className="text-default-400 ml-1">({topic.savedCount}q)</span>}
                {topic.status === 'error' && topic.errorMessage && (
                  <span className="text-default-400 ml-1">— {topic.errorMessage}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    ) : null;

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
          endContent={topicList}
        />
      );
    }

    return (
      <InlineAlert
        color="warning"
        startContent={<Spinner color="warning" size="sm" />}
        title={t('generate.generatingFullExam')}
        description={t('generate.generatingProgressNotify', {
          completed: batchProgress.completed,
          total: batchProgress.total,
        })}
        endContent={
          <>
            {topicList}
            <Button
              className={`${buttonStyles.dangerFlat} mt-2`}
              size="sm"
              onPress={handleCancelBatch}
            >
              {t('common.cancel')}
            </Button>
          </>
        }
      />
    );
  }
}
