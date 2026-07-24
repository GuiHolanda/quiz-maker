'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

import { GeneratedQuestionsList } from './GeneratedQuestionsList';
import { QuestionGeneratorForm } from './QuestionGeneratorForm';
import { FullExamDistributionTable } from './FullExamDistributionTable';
import { ActiveJobStatus } from './ActiveJobStatus';

import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import type { AIPublicExamQuestion, FullExamJobTopicStatus } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';
import {
  createFullExamJob,
  getActiveFullExamJob,
  cancelFullExamJob,
  saveFullExamJob,
  getFullExamJob,
} from '@/features/connectors';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useNotificationsContext } from '@/features/hooks/useNotificationsContext.hook';
import { notify } from '@/shared/lib/notify';
import useQuizContext from '@/features/hooks/useQuizContext.hook';

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

export function PublicExamQuestionsContent({ onSaved }: { readonly onSaved?: () => void }) {
  const { t } = useTranslation();
  const { state, setAIquestions, setSelectedAIquestions } = useQuizContext();
  const { publicExams, selectedPublicExam, selectedSubjects, isLoading } = usePublicExamsContext();
  const { refreshUsage } = useUsageContext();
  const { addNotification } = useNotificationsContext();

  const [isFullExamMode, setIsFullExamMode] = useState(false);
  const [jobStatus, setJobStatus] = useState<'running' | 'awaiting_review' | 'done' | 'error' | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchTopics, setBatchTopics] = useState<FullExamJobTopicStatus[]>([]);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [showSimuladosBanner, setShowSimuladosBanner] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const aiQuestions = state?.aiQuestions ?? [];
  const selectedIds = state?.selectedAIQuestions ?? [];

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

      es.addEventListener('awaiting_review', (e) => {
        const data = JSON.parse(e.data) as { doneTopics: number; totalTopics: number; topics?: FullExamJobTopicStatus[] };
        es.close();
        eventSourceRef.current = null;
        setIsBatchGenerating(false);
        setJobStatus('awaiting_review');
        setBatchProgress({ completed: data.doneTopics, total: data.totalTopics });
        if (data.topics) setBatchTopics(data.topics);
      });

      es.addEventListener('done', (e) => {
        const data = JSON.parse(e.data) as { doneTopics: number; totalTopics: number; savedCount: number; topics?: FullExamJobTopicStatus[] };
        es.close();
        eventSourceRef.current = null;
        setIsBatchGenerating(false);
        setJobStatus('done');
        if (data.topics) setBatchTopics(data.topics);
        refreshUsage();
        setShowSimuladosBanner(true);
        onSaved?.();
        if (selectedPublicExam) {
          try {
            localStorage.setItem(
              SIMULADO_NEW_PREFILL_KEY,
              JSON.stringify({ type: 'public_exam', examId: selectedPublicExam.id, totalQuestions: selectedPublicExam.totalQuestions }),
            );
          } catch {}
          addNotification({
            title: t('notification.fullExamTitle'),
            description: t('notification.fullExamDescription', { certName: selectedPublicExam.name, total: data.savedCount, topics: data.doneTopics }),
            ctaLabel: t('generate.createSimulado'),
            ctaHref: '/simulados?tab=new',
          });
        }
      });

      es.addEventListener('error', () => {
        es.close();
        eventSourceRef.current = null;
        setIsBatchGenerating(false);
        setJobStatus('error');
      });
    },
    [selectedPublicExam, addNotification, t, refreshUsage],
  );

  async function handleFormSubmit(numQuestions: string) {
    const selectedSubject = selectedSubjects[0];
    if (!selectedPublicExam) {
      notify.warning(t('toast.validationError'), t('error.publicExamRequired'));
      return;
    }
    if (!selectedSubject) {
      notify.warning(t('toast.validationError'), t('error.subjectRequired'));
      return;
    }

    setIsBatchGenerating(true);
    setJobStatus('running');
    setBatchProgress({ completed: 0, total: 1 });
    setBatchTopics([]);

    try {
      const { jobId } = await createFullExamJob({
        type: 'public_exam',
        refKey: selectedPublicExam.id!,
        refName: selectedPublicExam.name,
        examBoardName: selectedPublicExam.examBoard?.name,
        distribution: [{ topicName: selectedSubject, questionCount: parseInt(numQuestions, 10) || 5 }],
      });
      setBatchJobId(jobId);
      connectToJobStream(jobId);
    } catch {
      setIsBatchGenerating(false);
      setJobStatus(null);
    }
  }

  async function handleFullExamGenerate(subjectDistribution: Array<{ topicName: string; questionCount: number }>) {
    if (!selectedPublicExam) return;
    const validSubjects = subjectDistribution.filter((entry) => entry.questionCount > 0);
    if (validSubjects.length === 0) return;

    setIsBatchGenerating(true);
    setJobStatus('running');
    setBatchProgress({ completed: 0, total: validSubjects.length });
    setBatchTopics([]);

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
      setJobStatus(null);
    }
  }

  async function handleCancelBatch() {
    if (!batchJobId) return;
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsBatchGenerating(false);
    setJobStatus(null);
    try {
      await cancelFullExamJob(batchJobId);
    } catch {}
    setBatchJobId(null);
  }

  async function handleSaveAll() {
    if (!batchJobId) return;
    setIsSavingJob(true);
    try {
      const { savedCount } = await saveFullExamJob(batchJobId);
      setJobStatus('done');
      refreshUsage();
      setShowSimuladosBanner(true);
      onSaved?.();
      if (selectedPublicExam) {
        try {
          localStorage.setItem(
            SIMULADO_NEW_PREFILL_KEY,
            JSON.stringify({ type: 'public_exam', examId: selectedPublicExam.id, totalQuestions: selectedPublicExam.totalQuestions }),
          );
        } catch {}
        addNotification({
          title: t('notification.fullExamTitle'),
          description: t('notification.fullExamDescription', {
            certName: selectedPublicExam.name,
            total: savedCount,
            topics: batchTopics.filter((topic) => topic.status === 'done').length,
          }),
          ctaLabel: t('generate.createSimulado'),
          ctaHref: '/simulados?tab=new',
        });
      }
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
    } finally {
      setIsSavingJob(false);
    }
  }

  async function handleReviewAndSelect() {
    if (!batchJobId) return;
    try {
      const job = await getFullExamJob(batchJobId);
      const pending = job.topics
        .filter((topic) => topic.status === 'done')
        .flatMap((topic) => {
          const topicWithJson = topic as FullExamJobTopicStatus & { pendingQuestionsJson?: string };
          return topicWithJson.pendingQuestionsJson
            ? (JSON.parse(topicWithJson.pendingQuestionsJson) as AIPublicExamQuestion[])
            : [];
        });
      setAIquestions(pending as any, null);
      setJobStatus('done');
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
    }
  }

  const onSave = async () => {
    if (!batchJobId) return;
    setIsSavingJob(true);
    try {
      await saveFullExamJob(batchJobId);
      setSelectedAIquestions([]);
      setAIquestions([], null);
      refreshUsage();
      setShowSimuladosBanner(true);
      onSaved?.();
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
    } finally {
      setIsSavingJob(false);
    }
  };

  const onDiscard = () => {
    setSelectedAIquestions([]);
    setAIquestions([], null);
  };

  useEffect(() => {
    if (!selectedPublicExam?.id) return;
    getActiveFullExamJob({ type: 'public_exam', refKey: selectedPublicExam.id }).then((job) => {
      if (job && (job.status === 'running' || job.status === 'awaiting_review')) {
        setIsBatchGenerating(job.status === 'running');
        setJobStatus(job.status);
        setBatchProgress({ completed: job.doneTopics, total: job.totalTopics });
        if (job.topics) setBatchTopics(job.topics);
        setBatchJobId(job.id);
        if (job.status === 'running') connectToJobStream(job.id);
      }
    });
  }, [selectedPublicExam?.id]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

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

    const showActiveJob = (isBatchGenerating || jobStatus === 'awaiting_review') && batchJobId;

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
            setJobStatus(null);
            setBatchProgress({ completed: 0, total: 0 });
          }}
          onGenerationStart={handleFormSubmit}
        />
        {showActiveJob && (
          <ActiveJobStatus
            refName={selectedPublicExam?.name ?? ''}
            status={jobStatus ?? 'running'}
            doneTopics={batchProgress.completed}
            totalTopics={batchProgress.total}
            topics={batchTopics}
            isSaving={isSavingJob}
            onCancel={handleCancelBatch}
            onSaveAll={handleSaveAll}
            onReviewAndSelect={handleReviewAndSelect}
          />
        )}
        {aiQuestions.length > 0 && (
          <GeneratedQuestionsList
            isLoadingMore={false}
            isSaving={isSavingJob}
            questions={aiQuestions}
            remainingCount={0}
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

  function renderFullExamSlot() {
    if (!selectedPublicExam) {
      return <p className="text-xs text-default-400 py-2">{t('concurso.selectPublicExamPlaceholder')}</p>;
    }

    const distributedItems = distributeByWeight(
      selectedPublicExam.subjects.map((subject) => ({ name: subject.name, weight: subject.maxQuestions })),
      selectedPublicExam.totalQuestions,
    );

    if (distributedItems.length === 0) {
      return <p className="text-xs text-default-400 py-2">{t('simulado.noQuestionsTitle')}</p>;
    }

    return (
      <FullExamDistributionTable
        key={selectedPublicExam.id}
        isGenerating={isBatchGenerating}
        items={distributedItems}
        onGenerate={handleFullExamGenerate}
      />
    );
  }
}
