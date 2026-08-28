'use client';

import type { Exam, ExamType } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';

import { fmtTempo, normalizeMock, UnifiedSimulado } from './list/normalizeSimulado';
import { PresetShortcuts } from './create/PresetShortcuts';
import { ScopePicker } from './create/ScopePicker';
import { ExamAndCountRow } from './create/ExamAndCountRow';
import { TimePicker } from './create/TimePicker';
import { SourcePicker } from './create/SourcePicker';
import { TopicChecklist } from './create/TopicChecklist';
import { SummarySidebar } from './create/SummarySidebar';
import { GenerationPanel } from './create/GenerationPanel';
import {
  SimuladoFormState,
  buildCreatePayload,
  coveragePercent,
  distributeQuestions,
  sectionWeights,
} from './create/simuladoFormState';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { createMockExam, ensureMockExamAnswers, startMockExamAttempt } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { inputProperties } from '@/config/constants/inputStyles';
import { SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';

const FIELD_LABEL = 'text-xs font-semibold text-default-400';

const INITIAL_STATE: SimuladoFormState = {
  name: '',
  scope: 'certification',
  examId: null,
  totalQuestions: 0,
  timeMode: 'oficial',
  customMinutes: 60,
  source: 'library',
  selectedSections: [],
};

function extractMessage(error: unknown): string | undefined {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

function deriveFromExam(exam: Exam): Partial<SimuladoFormState> {
  return {
    examId: exam.id ?? null,
    totalQuestions: exam.totalQuestions,
    customMinutes: exam.examDurationMinutes ?? 60,
    selectedSections: exam.sections.map((section) => section.name),
  };
}

export function CreateSimuladoSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { certifications, publicExams, isLoading } = useExamsContext();
  const { addMockExam } = useMockExamsContext();

  const [state, setState] = useState<SimuladoFormState>(INITIAL_STATE);
  const [isBusy, setIsBusy] = useState(false);
  const [phase, setPhase] = useState<'config' | 'gerando' | 'pronto'>('config');
  const [stepIndex, setStepIndex] = useState(0);
  const [postDone, setPostDone] = useState(false);
  const [createdSimulado, setCreatedSimulado] = useState<UnifiedSimulado | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const prefillApplied = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'gerando') return;

    if (stepIndex >= 4 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (stepIndex >= 4 && postDone) {
      setPhase('pronto');
      setIsBusy(false);
    }
  }, [phase, stepIndex, postDone]);

  const list = state.scope === 'certification' ? certifications : publicExams;
  const exam = list.find((candidate) => candidate.id === state.examId) ?? list[0] ?? null;

  useEffect(() => {
    if (isLoading || list.length === 0 || !list[0]?.id) return;
    const isValid = list.some((candidate) => candidate.id === state.examId);

    if (isValid) return;
    setState((prev) => ({ ...prev, ...deriveFromExam(list[0]) }));
  }, [isLoading, list, state.examId]);

  useEffect(() => {
    if (isLoading || prefillApplied.current) return;
    if (certifications.length === 0 && publicExams.length === 0) return;
    prefillApplied.current = true;
    try {
      const raw = localStorage.getItem(SIMULADO_NEW_PREFILL_KEY);

      if (!raw) return;
      localStorage.removeItem(SIMULADO_NEW_PREFILL_KEY);
      const prefill = JSON.parse(raw) as { examId?: string; totalQuestions?: number };

      if (!prefill.examId) return;
      const target = [...certifications, ...publicExams].find((candidate) => candidate.id === prefill.examId);

      if (!target) return;
      setState((prev) => ({
        ...prev,
        scope: target.type,
        ...deriveFromExam(target),
        totalQuestions: prefill.totalQuestions ?? target.totalQuestions,
      }));
    } catch {}
  }, [isLoading, certifications, publicExams]);

  const weights = exam ? sectionWeights(exam.sections) : {};
  const distribution = exam ? distributeQuestions(exam.sections, state.selectedSections, state.totalQuestions) : [];
  const coverage = exam ? coveragePercent(exam.sections, state.selectedSections) : 0;
  const countByName = new Map(distribution.map((entry) => [entry.sectionName, entry.questionCount]));

  const topicRows = (exam?.sections ?? []).map((section) => ({
    name: section.name,
    weight: weights[section.name] ?? 0,
    count: countByName.get(section.name) ?? 0,
  }));

  const selectedCount = state.selectedSections.length;
  const sectionCount = exam?.sections.length ?? 0;

  const examOptions = list.map((candidate) => ({
    id: candidate.id ?? candidate.name,
    label: [candidate.name, candidate.role].filter(Boolean).join(' · '),
  }));

  const examLabel =
    state.scope === 'certification'
      ? t('simulado.create.examLabelCertification')
      : t('simulado.create.examLabelConcurso');

  const officialLabel = t('simulado.create.timeOfficial', {
    time: exam?.examDurationMinutes != null ? fmtTempo(exam.examDurationMinutes) : '—',
  });

  const hasExam = exam != null;
  const needsCustomMinutes = state.timeMode === 'personalizado' && state.customMinutes <= 0;
  const tooFewForTopics = state.totalQuestions > 0 && state.totalQuestions < selectedCount;

  let statusTone: 'ok' | 'warn' = 'warn';
  let statusText: string;

  if (!hasExam || selectedCount === 0) {
    statusText = t('simulado.create.statusNeedTopic');
  } else if (state.totalQuestions <= 0 || needsCustomMinutes) {
    statusText = t('simulado.create.statusNeedCount');
  } else if (tooFewForTopics) {
    statusText = t('simulado.create.statusTooFewTopics');
  } else {
    statusTone = 'ok';
    statusText = t('simulado.create.statusReady', { count: state.totalQuestions, percent: coverage });
  }

  const canCreate = statusTone === 'ok' && hasExam && !isBusy;

  const summaryRows = [
    { label: t('simulado.create.summaryExam'), value: exam?.name ?? '—' },
    { label: t('simulado.create.summaryQuestions'), value: String(state.totalQuestions) },
    { label: t('simulado.create.summaryTime'), value: resolveSummaryTime() },
    { label: t('simulado.create.summarySource'), value: t('simulado.create.sourceLibraryTitle') },
    {
      label: t('simulado.create.summaryTopics'),
      value: t('simulado.create.summaryTopicsValue', { selected: selectedCount, total: sectionCount }),
    },
    {
      label: t('simulado.create.summaryCoverage'),
      value: t('simulado.create.summaryCoverageValue', { percent: coverage }),
      highlight: true,
    },
  ];

  const notes = [t('simulado.create.note1'), t('simulado.create.note2'), t('simulado.create.note3')];

  const simuladoName = createdSimulado?.name ?? (state.name.trim() || exam?.name || '');
  const summaryLine = t('simulado.create.generatingMeta', {
    questions: state.totalQuestions,
    time: resolveSummaryTime(),
    topics: selectedCount,
  });

  if (isLoading) {
    return <SkeletonListLoader count={4} height="h-12" />;
  }

  if (certifications.length === 0 && publicExams.length === 0) {
    return (
      <EmptyState
        action={{ href: '/exams', label: t('exam.tabNew') }}
        description={t('exam.noExamsDescription')}
        title={t('exam.noExamsTitle')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="flex flex-col gap-6">
        {phase === 'config' ? (
          <>
            <PresetShortcuts exam={exam} />
            {renderConfigCard()}
          </>
        ) : (
          <GenerationPanel
            isStarting={isStarting}
            phase={phase}
            simuladoName={simuladoName}
            stepIndex={stepIndex}
            summaryLine={summaryLine}
            onCreateAnother={handleCreateAnother}
            onStart={handleStart}
          />
        )}
      </div>

      <SummarySidebar
        canCreate={canCreate}
        footnote={resolveFootnote()}
        isBusy={isBusy}
        notes={notes}
        rows={summaryRows}
        statusText={statusText}
        statusTone={statusTone}
        onCreate={handleCreate}
      />
    </div>
  );

  function resolveFootnote(): string | undefined {
    if (phase === 'gerando') return t('simulado.create.generatingFootnote');
    if (phase === 'pronto') return t('simulado.create.readyFootnote');

    return undefined;
  }

  function resolveSummaryTime(): string {
    if (state.timeMode === 'livre') return t('simulado.create.timeFree');

    const minutes = state.timeMode === 'personalizado' ? state.customMinutes : (exam?.examDurationMinutes ?? null);

    return minutes != null && minutes > 0 ? fmtTempo(minutes) : '—';
  }

  function patchState(patch: Partial<SimuladoFormState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function handleExam(nextId: string) {
    const target = list.find((candidate) => (candidate.id ?? candidate.name) === nextId);

    if (target) patchState({ timeMode: 'oficial', ...deriveFromExam(target) });
  }

  function handleToggleSection(name: string) {
    setState((prev) => {
      const isSelected = prev.selectedSections.includes(name);
      const selectedSections = isSelected
        ? prev.selectedSections.filter((section) => section !== name)
        : [...prev.selectedSections, name];

      return { ...prev, selectedSections };
    });
  }

  function handleAllSections() {
    if (exam) patchState({ selectedSections: exam.sections.map((section) => section.name) });
  }

  function handleNoSections() {
    patchState({ selectedSections: [] });
  }

  function clearGenerationInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function resetForm() {
    if (!exam) return;
    setState((prev) => ({
      ...prev,
      name: '',
      timeMode: 'oficial',
      ...deriveFromExam(exam),
    }));
  }

  async function handleCreate() {
    if (!exam || !canCreate) return;

    setIsBusy(true);
    setPhase('gerando');
    setStepIndex(0);
    setPostDone(false);
    setCreatedSimulado(null);

    clearGenerationInterval();
    intervalRef.current = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, 4));
    }, 1600);

    try {
      const saved = await createMockExam(buildCreatePayload(state, exam));

      addMockExam(saved);
      notify.success(t('simulado.created'), t('simulado.createdDescription', { name: saved.name ?? exam.name }));
      setCreatedSimulado(normalizeMock(saved));
      setPostDone(true);
    } catch (err) {
      clearGenerationInterval();
      setPhase('config');
      setStepIndex(0);
      setPostDone(false);
      setIsBusy(false);
      notify.error(t('toast.error'), extractMessage(err) ?? t('toast.somethingWrong'));
    }
  }

  async function handleStart() {
    if (!createdSimulado) return;

    setIsStarting(true);
    try {
      ensureMockExamAnswers(createdSimulado.id).catch(() => {});
      const attempt = await startMockExamAttempt(createdSimulado.id);

      router.push(`/simulados/${createdSimulado.id}/tentativa/${attempt.id}`);
    } catch (err) {
      notify.error(t('toast.error'), extractMessage(err) ?? t('toast.somethingWrong'));
      setIsStarting(false);
    }
  }

  function handleCreateAnother() {
    clearGenerationInterval();
    setPhase('config');
    setStepIndex(0);
    setPostDone(false);
    setCreatedSimulado(null);
    setIsBusy(false);
    setIsStarting(false);
    resetForm();
  }

  function renderConfigCard() {
    return (
      <div className="flex flex-col gap-6 rounded-xl bg-content1 p-6">
        <div className="flex flex-col gap-2">
          <span className={FIELD_LABEL}>{t('simulado.create.nameLabel')}</span>
          <Input
            {...inputProperties.input}
            aria-label={t('simulado.create.nameLabel')}
            data-testid="simulado-name-input"
            placeholder={t('simulado.create.namePlaceholder')}
            value={state.name}
            onValueChange={(value) => patchState({ name: value })}
          />
        </div>

        <ScopePicker value={state.scope} onChange={(scope: ExamType) => patchState({ scope })} />

        <ExamAndCountRow
          examId={exam?.id ?? null}
          examLabel={examLabel}
          exams={examOptions}
          totalQuestions={state.totalQuestions}
          onExam={handleExam}
          onTotal={(value) => patchState({ totalQuestions: value })}
        />

        <TimePicker
          customMinutes={state.customMinutes}
          mode={state.timeMode}
          officialLabel={officialLabel}
          onCustomMinutes={(minutes) => patchState({ customMinutes: minutes })}
          onMode={(timeMode) => patchState({ timeMode })}
        />

        <SourcePicker examId={state.examId} value={state.source} />

        <TopicChecklist
          sections={topicRows}
          selected={state.selectedSections}
          onAll={handleAllSections}
          onNone={handleNoSections}
          onToggle={handleToggleSection}
        />
      </div>
    );
  }
}
