'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NumberInput } from '@heroui/number-input';
import { Select, SelectItem } from '@heroui/select';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { faGraduationCap, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { GenerationHistory } from './GenerationHistory';
import { ActiveJobStatus } from './ActiveJobStatus';
import { GenerationDistributionTable } from './GenerationDistributionTable';
import { GenerationSummarySidebar } from './GenerationSummarySidebar';
import { useGenerationDistribution } from './useGenerationDistribution.hook';

import type { Exam, ExamType } from '@/shared/types';
import { EntitySelect } from '@/shared/components/EntitySelect';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useGenerationJobsContext } from '@/features/hooks/useGenerationJobsContext.hook';
import { ExamTypePicker } from '@/shared/components/ui/ExamTypePicker';
import { FieldLabel } from '@/shared/components/ui/FieldLabel';
import { type KeyValueRow } from '@/shared/components/ui/KeyValueList';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { inputProperties } from '@/config/constants/inputStyles';
import { GENERATION_MAX_ACTIVE_JOBS_PER_USER } from '@/config/constants';
import { GENERATION_LANGUAGES, resolveGenerationLanguage } from '@/config/generation-languages';
import type { GenerationLanguage } from '@/config/generation-languages';
import {
  writeSimuladoPrefill,
  buildSimuladoPrefillFromJob,
} from '@/app/(workspace)/simulados/components/create/simuladoPrefill';

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
  const { t, language: uiLanguage } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { certifications, publicExams, isLoading } = useExamsContext();
  const { jobs, startJob, cancelJob, dismissJob } = useGenerationJobsContext();

  const [scope, setScope] = useState<ExamType>((searchParams.get('type') as ExamType) ?? 'certification');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [language, setLanguage] = useState<GenerationLanguage>(() => resolveGenerationLanguage(uiLanguage));
  const [isStarting, setIsStarting] = useState(false);

  const languageTouched = useRef(false);

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);

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
    if (!languageTouched.current) setLanguage(resolveGenerationLanguage(uiLanguage));
  }, [uiLanguage]);

  useEffect(() => {
    if (isLoading) return;
    const stillValid = exams.some((exam) => examKey(exam) === selectedExamId);
    if (stillValid) return;
    const first = exams[0] ?? null;
    setSelectedExamId(first ? examKey(first) : null);
    setTotal(first?.totalQuestions ?? 0);
  }, [isLoading, exams, selectedExamId]);

  const activeJobCount = jobs.filter((job) => job.status !== 'done').length;
  const prevActiveJobCount = useRef(activeJobCount);

  useEffect(() => {
    if (activeJobCount !== prevActiveJobCount.current) {
      if (activeJobCount > prevActiveJobCount.current) {
        requestAnimationFrame(() => jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
      setHistoryRefreshKey((key) => key + 1);
      prevActiveJobCount.current = activeJobCount;
    }
  }, [activeJobCount]);

  const visibleJobs = mounted ? jobs : [];
  const atJobLimit = mounted && activeJobCount >= GENERATION_MAX_ACTIVE_JOBS_PER_USER;

  const currentSum = dist.currentTotal;
  const status = resolveStatus();
  const canGenerate = status.tone === 'ok' && !!selectedExam?.id && !atJobLimit && !isStarting;

  return (
    <PageHeader
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

        <GenerationHistory refreshKey={historyRefreshKey} />
      </div>
    </PageHeader>
  );

  function renderActiveJobs() {
    if (visibleJobs.length === 0) return null;
    return (
      <div ref={jobsSectionRef} className="flex flex-col gap-4 border-t border-divider pt-6">
        <FieldLabel>{t('generate.activeGenerations', { count: visibleJobs.length })}</FieldLabel>
        {visibleJobs.map((job) => (
          <ActiveJobStatus
            key={job.jobId}
            doneTopics={job.doneTopics}
            queuedTopics={job.queuedTopics}
            refName={job.refName}
            status={job.status}
            topics={job.topics}
            totalTopics={job.totalTopics}
            type={job.type}
            onCancel={() => cancelJob(job.jobId)}
            onCreateSimulado={() => handleCreateSimulado(job)}
            onDismiss={() => dismissJob(job.jobId)}
          />
        ))}
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
        <ExamTypePicker
          certification={{
            title: t('generate.typeCertification'),
            body: t('generate.chooseTypeCertification'),
            testId: 'type-option-certification',
          }}
          label={t('generate.scopeSectionLabel')}
          publicExam={{
            title: t('generate.typePublicExam'),
            body: t('generate.chooseTypePublicExam'),
            testId: 'type-option-public_exam',
          }}
          value={scope}
          onChange={handleScopeChange}
        />
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
      <div
        className={`grid grid-cols-1 gap-4 sm:items-end ${
          isCert ? 'sm:grid-cols-[minmax(0,1fr)_160px_150px]' : 'sm:grid-cols-[minmax(0,1fr)_180px]'
        }`}
      >
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

        {isCert && (
          <Select
            {...inputProperties.select}
            disallowEmptySelection
            id="generation_language"
            label={t('generate.language')}
            placeholder=" "
            selectedKeys={new Set([language])}
            onSelectionChange={(keys) => {
              const next = String(Array.from(keys)[0] ?? '');
              if (next === 'pt' || next === 'en') {
                languageTouched.current = true;
                setLanguage(next);
              }
            }}
          >
            {GENERATION_LANGUAGES.map((code) => (
              <SelectItem key={code}>{t(`generate.language_${code}`)}</SelectItem>
            ))}
          </Select>
        )}

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

  function configSummaryRows(): KeyValueRow[] {
    const scopeLabel =
      scope === 'certification' ? t('questionBank.typeCertification') : t('questionBank.typePublicExam');
    const avg = dist.activeCount > 0 ? Math.round(currentSum / dist.activeCount) : 0;

    return [
      { label: t('generate.summaryScope'), value: scopeLabel },
      { label: t('generate.summaryExam'), value: selectedExam?.name ?? '—' },
      ...(scope === 'certification'
        ? [{ label: t('generate.language'), value: t(`generate.language_${language}`) }]
        : []),
      { label: t('generate.summaryActiveTopics'), value: String(dist.activeCount) },
      {
        label: t('generate.summaryDistributed'),
        value: t('generate.summaryQuestionsValue', { count: currentSum }),
        tone: 'primary',
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
        language: scope === 'certification' ? language : undefined,
        distribution,
      });
    } finally {
      setIsStarting(false);
    }
  }

  function handleCreateSimulado(job: (typeof jobs)[number]) {
    const prefill = buildSimuladoPrefillFromJob({ refKey: job.refKey, topics: job.topics });
    if (prefill) writeSimuladoPrefill(prefill);
    router.push('/simulados');
  }
}
