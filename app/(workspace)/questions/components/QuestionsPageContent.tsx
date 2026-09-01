'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { NumberInput } from '@heroui/number-input';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import Link from 'next/link';
import { faGraduationCap, faClipboardList, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { GenerationHistory } from './GenerationHistory';
import { ActiveJobStatus } from './ActiveJobStatus';
import { GeneratedQuestionsList } from './GeneratedQuestionsList';
import { GenerationScopePicker } from './GenerationScopePicker';
import { GenerationDistributionTable } from './GenerationDistributionTable';
import { GenerationSummarySidebar, type SummaryRow } from './GenerationSummarySidebar';
import { useGenerationDistribution } from './useGenerationDistribution.hook';

import type { AIQuestion, Exam, ExamType } from '@/shared/types';
import { EntitySelect } from '@/shared/components/EntitySelect';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useGenerationJobsContext } from '@/features/hooks/useGenerationJobsContext.hook';
import type { TrackedJob } from '@/features/providers/generationJobs.provider';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';
import { GENERATION_MAX_ACTIVE_JOBS_PER_USER } from '@/config/constants';
import { notify } from '@/shared/lib/notify';

const EMPTY_COPY: Record<
  ExamType,
  { href: string; labelKey: string; titleKey: string; descriptionKey: string; icon: IconDefinition }
> = {
  certification: {
    href: '/exams?type=certification',
    labelKey: 'certification.tabNew',
    titleKey: 'certification.noCertificationsTitle',
    descriptionKey: 'certification.noCertificationsDescription',
    icon: faGraduationCap,
  },
  public_exam: {
    href: '/exams?type=public_exam',
    labelKey: 'concurso.tabNew',
    titleKey: 'concurso.noExamsTitle',
    descriptionKey: 'concurso.noExamsDescription',
    icon: faClipboardList,
  },
};

const examKey = (exam: Exam) => exam.id ?? exam.name;
const estimateMinutes = (topicCount: number) => Math.max(1, Math.ceil(topicCount / 5) * 2);

export function QuestionsPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { certifications, publicExams, isLoading } = useExamsContext();
  const { state, setAIquestions, setSelectedAIquestions } = useQuizContext();
  const { jobs, startJob, cancelJob, saveAllJob, getJobPendingQuestions } = useGenerationJobsContext();

  const [scope, setScope] = useState<ExamType>((searchParams.get('type') as ExamType) ?? 'certification');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [showSimuladosBanner, setShowSimuladosBanner] = useState(false);
  const [reviewJob, setReviewJob] = useState<TrackedJob | null>(null);
  const [mounted, setMounted] = useState(false);

  const prevActiveCount = useRef(jobs.length);
  const reviewSectionRef = useRef<HTMLElement>(null);
  const jobsSectionRef = useRef<HTMLDivElement>(null);

  const exams = scope === 'certification' ? certifications : publicExams;
  const selectedExam = exams.find((exam) => examKey(exam) === selectedExamId) ?? null;
  const weightedTopics = useMemo(
    () => (selectedExam?.sections ?? []).map((section) => ({ name: section.name, weight: section.maxQuestions })),
    [selectedExam]
  );

  const dist = useGenerationDistribution(
    weightedTopics,
    selectedExam?.totalQuestions ?? 0,
    total,
    selectedExamId ?? ''
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const stillValid = exams.some((exam) => examKey(exam) === selectedExamId);
    if (stillValid) return;
    const first = exams[0] ?? null;
    setSelectedExamId(first ? examKey(first) : null);
    setTotal(first?.totalQuestions ?? 0);
  }, [isLoading, exams, selectedExamId]);

  useEffect(() => {
    if (jobs.length > prevActiveCount.current) {
      requestAnimationFrame(() => jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      setHistoryRefreshKey((key) => key + 1);
    } else if (jobs.length < prevActiveCount.current) {
      setHistoryRefreshKey((key) => key + 1);
      setShowSimuladosBanner(true);
    }
    prevActiveCount.current = jobs.length;
  }, [jobs.length]);

  const aiQuestions = state?.aiQuestions ?? [];
  const selectedIds = state?.selectedAIQuestions ?? [];

  const visibleJobs = mounted ? jobs.filter((job) => job.jobId !== reviewJob?.jobId) : [];
  const reviewing = aiQuestions.length > 0 || visibleJobs.some((job) => job.status === 'awaiting_review');
  const atJobLimit = mounted && jobs.length >= GENERATION_MAX_ACTIVE_JOBS_PER_USER;

  const currentSum = dist.currentTotal;
  const status = resolveStatus();
  const canGenerate = status.tone === 'ok' && !!selectedExam?.id && !atJobLimit && !isStarting;

  return (
    <PageHeader
      action={renderStepIndicator()}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem>{t('nav.generateQuestions')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={t('generate.pageSubtitle')}
      title={t('generate.pageTitle')}
    >
      <div className="flex flex-col gap-6">
        {renderSimuladosBanner()}

        {isLoading && visibleJobs.length === 0 ? (
          <SkeletonListLoader count={4} />
        ) : exams.length === 0 && visibleJobs.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-6">
              {exams.length > 0 && renderConfig()}
              {renderActiveJobs()}
            </div>

            <GenerationSummarySidebar
              canGenerate={canGenerate}
              hasSurplus={status.tone === 'warn' && dist.rows.length > 0}
              isBusy={isStarting}
              rows={configSummaryRows()}
              statusText={
                atJobLimit ? t('generate.jobLimitReached', { max: GENERATION_MAX_ACTIVE_JOBS_PER_USER }) : status.text
              }
              statusTone={atJobLimit ? 'warn' : status.tone}
              onAutoAdjust={dist.redistribute}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {renderReviewList()}
        <GenerationHistory refreshKey={historyRefreshKey} />
      </div>
    </PageHeader>
  );

  function renderActiveJobs() {
    if (visibleJobs.length === 0) return null;
    return (
      <div ref={jobsSectionRef} className="flex flex-col gap-4 border-t border-divider pt-6">
        <span className="text-xs font-semibold text-default-400">
          {t('generate.activeGenerations', { count: visibleJobs.length })}
        </span>
        {visibleJobs.map((job) => (
          <ActiveJobStatus
            key={job.jobId}
            doneTopics={job.doneTopics}
            isSaving={job.isSaving}
            queuedTopics={job.queuedTopics}
            refName={job.refName}
            status={job.status}
            topics={job.topics}
            totalTopics={job.totalTopics}
            type={job.type}
            onCancel={() => cancelJob(job.jobId)}
            onReviewAndSelect={() => handleReviewAndSelect(job.jobId)}
            onSaveAll={() => saveAllJob(job.jobId)}
          />
        ))}
      </div>
    );
  }

  function renderStepIndicator() {
    const step = reviewing ? 2 : 1;
    return (
      <div className="flex items-center gap-3.5">
        <span className="text-xs font-bold text-primary">
          {t('generate.stepIndicator', { current: step, total: 2 })}
        </span>
        <div className="flex w-[120px] gap-[5px]">
          <span className="h-[3px] flex-1 rounded-full bg-primary" />
          <span className={`h-[3px] flex-1 rounded-full ${step === 2 ? 'bg-primary' : 'bg-content2'}`} />
        </div>
      </div>
    );
  }

  function renderEmptyState() {
    const copy = EMPTY_COPY[scope];
    return (
      <IllustratedEmptyState
        action={{ href: copy.href, label: t(copy.labelKey) }}
        description={t(copy.descriptionKey)}
        icon={copy.icon}
        title={t(copy.titleKey)}
      />
    );
  }

  function renderConfig() {
    return (
      <div className="flex flex-col gap-6">
        <GenerationScopePicker value={scope} onChange={handleScopeChange} />
        {renderExamRow()}
        {selectedExam && (
          <GenerationDistributionTable
            isModified={dist.isModified}
            rows={dist.rows}
            onCountChange={dist.setCount}
            onRedistribute={dist.redistribute}
            onRemove={dist.remove}
          />
        )}
      </div>
    );
  }

  function renderExamRow() {
    const isCert = scope === 'certification';
    const items = exams.map((exam) => ({
      key: examKey(exam),
      label: [exam.name, exam.role, exam.examBoard?.name].filter(Boolean).join(' · '),
    }));

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
        <EntitySelect
          items={items}
          label={isCert ? t('certification.selectCertification') : t('concurso.selectPublicExam')}
          name={isCert ? 'certificationTitle' : 'publicExamName'}
          placeholder={
            isCert ? t('certification.selectCertificationPlaceholder') : t('concurso.selectPublicExamPlaceholder')
          }
          selectedKey={selectedExamId}
          onSelect={(key) => handleExamChange(key)}
        />

        <NumberInput
          {...inputProperties.numberInput}
          hideStepper
          id="total_questions"
          label={t('generate.totalQuestions')}
          minValue={1}
          placeholder={t('generate.totalQuestionsPlaceholder')}
          value={total}
          onValueChange={(value) => queueMicrotask(() => setTotal(Number.isFinite(value) ? value : 0))}
        />
      </div>
    );
  }

  function renderSimuladosBanner() {
    if (!showSimuladosBanner) return null;
    return (
      <InlineAlert
        color="success"
        endContent={
          <Button as={Link} className={buttonStyles.secondary} href="/simulados" size="sm" variant="bordered">
            {t('generate.goToSimulados')}
          </Button>
        }
        icon={faCircleCheck}
        title={t('generate.questionsReadyHint')}
        onDismiss={() => setShowSimuladosBanner(false)}
      />
    );
  }

  function renderReviewList() {
    if (!mounted || aiQuestions.length === 0) return null;
    const first = aiQuestions[0];
    const isPublicExam = reviewJob?.type === 'public_exam';
    const refName = reviewJob?.refName ?? first?.certificationTitle ?? '';

    return (
      <section ref={reviewSectionRef} className="mt-8 flex flex-col gap-4 border-t border-divider pt-8">
        <SectionHeader
          action={
            <Chip color="primary" size="sm" variant="flat">
              {t('generate.reviewCount', { count: aiQuestions.length })}
            </Chip>
          }
          icon={isPublicExam ? faClipboardList : faGraduationCap}
          label={refName || undefined}
          subtitle={t('generate.reviewSectionSubtitle')}
          title={t('generate.reviewSectionTitle')}
        />
        <GeneratedQuestionsList
          isLoadingMore={false}
          isSaving={false}
          questions={aiQuestions}
          remainingCount={0}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedAIquestions}
          onDiscard={handleReviewDiscard}
          onSave={handleReviewSave}
        />
      </section>
    );
  }

  function resolveStatus(): { tone: 'ok' | 'warn'; text: string } {
    if (currentSum === 0) return { tone: 'warn', text: t('generate.distStatusEmpty') };
    if (currentSum === total) {
      return { tone: 'ok', text: t('generate.distStatusOk', { distributed: currentSum, total }) };
    }
    if (currentSum < total) {
      return { tone: 'warn', text: t('generate.distStatusUnder', { count: total - currentSum, total }) };
    }
    return { tone: 'warn', text: t('generate.distStatusOver', { count: currentSum - total }) };
  }

  function configSummaryRows(): SummaryRow[] {
    const scopeLabel =
      scope === 'certification' ? t('questionBank.typeCertification') : t('questionBank.typePublicExam');
    const avg = dist.activeCount > 0 ? Math.round(currentSum / dist.activeCount) : 0;

    return [
      { label: t('generate.summaryScope'), value: scopeLabel },
      { label: t('generate.summaryExam'), value: selectedExam?.name ?? '—' },
      { label: t('generate.summaryActiveTopics'), value: String(dist.activeCount) },
      {
        label: t('generate.summaryDistributed'),
        value: t('generate.summaryQuestionsValue', { count: currentSum }),
        highlight: true,
      },
      {
        label: t('generate.summaryAvgPerTopic'),
        value: dist.activeCount > 0 ? t('generate.summaryQuestionsValue', { count: avg }) : '—',
      },
      {
        label: t('generate.summaryEstTime'),
        value:
          dist.activeCount > 0
            ? t('generate.summaryMinutesValue', { minutes: estimateMinutes(dist.activeCount) })
            : '—',
      },
    ];
  }

  function handleScopeChange(next: ExamType) {
    if (next === scope) return;
    setScope(next);
    const list = next === 'certification' ? certifications : publicExams;
    const first = list[0] ?? null;
    setSelectedExamId(first ? examKey(first) : null);
    setTotal(first?.totalQuestions ?? 0);
  }

  function handleExamChange(nextId: string | null) {
    if (!nextId) return;
    setSelectedExamId(nextId);
    const next = exams.find((exam) => examKey(exam) === nextId);
    setTotal(next?.totalQuestions ?? 0);
  }

  async function handleGenerate() {
    if (!selectedExam?.id || !canGenerate) return;
    const distribution = dist.buildDistribution();
    if (distribution.length === 0) return;

    setIsStarting(true);
    try {
      await startJob({
        type: scope,
        refKey: selectedExam.id,
        refName: selectedExam.name,
        examBoardName: selectedExam.examBoard?.name,
        totalQuestions: selectedExam.totalQuestions,
        distribution,
      });
    } finally {
      setIsStarting(false);
    }
  }

  async function handleReviewAndSelect(jobId: string) {
    const job = jobs.find((candidate) => candidate.jobId === jobId) ?? null;
    try {
      const pending = await getJobPendingQuestions(jobId);
      setAIquestions(pending as unknown as AIQuestion[], null);
      setReviewJob(job);
      requestAnimationFrame(() => reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
    }
  }

  async function handleReviewSave() {
    if (reviewJob) await saveAllJob(reviewJob.jobId);
    setReviewJob(null);
    setAIquestions([], null);
    setSelectedAIquestions([]);
  }

  async function handleReviewDiscard() {
    if (reviewJob) await cancelJob(reviewJob.jobId);
    setReviewJob(null);
    setSelectedAIquestions([]);
    setAIquestions([], null);
  }
}
