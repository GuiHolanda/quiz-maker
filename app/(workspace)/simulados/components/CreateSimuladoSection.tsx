'use client';

import type { Exam, ExamType, MockExamQuestionSource } from '@/shared/types';

import { useEffect, useState } from 'react';
import { Input } from '@heroui/input';

import { fmtTempo } from './list/normalizeSimulado';
import { PresetShortcuts } from './create/PresetShortcuts';
import { ScopePicker } from './create/ScopePicker';
import { ExamAndCountRow } from './create/ExamAndCountRow';
import { TimePicker } from './create/TimePicker';
import { SourcePicker } from './create/SourcePicker';
import { TopicChecklist } from './create/TopicChecklist';
import { SummarySidebar } from './create/SummarySidebar';
import { GenerationPanel } from './create/GenerationPanel';
import { useSimuladoAvailability } from './create/useSimuladoAvailability.hook';
import { useSimuladoGeneration } from './create/useSimuladoGeneration.hook';
import { useSimuladoPrefill } from './create/useSimuladoPrefill.hook';
import {
  PresetKey,
  SimuladoFormState,
  applyPreset,
  coveragePercent,
  distributeQuestions,
  matchesPreset,
  sectionWeights,
} from './create/simuladoFormState';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { inputProperties } from '@/config/constants/inputStyles';

const FIELD_LABEL = 'text-xs font-semibold text-default-400';

const SOURCE_TITLE_KEY: Record<MockExamQuestionSource, string> = {
  library: 'simulado.create.sourceLibraryTitle',
  unseen: 'simulado.create.sourceUnseenTitle',
  wrong: 'simulado.create.sourceWrongTitle',
};

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

function deriveFromExam(exam: Exam): Partial<SimuladoFormState> {
  return {
    examId: exam.id ?? null,
    totalQuestions: exam.totalQuestions,
    customMinutes: exam.examDurationMinutes ?? 60,
    source: 'library',
    selectedSections: exam.sections.map((section) => section.name),
  };
}

export function CreateSimuladoSection() {
  const { t } = useTranslation();
  const { certifications, publicExams, isLoading } = useExamsContext();

  const [state, setState] = useState<SimuladoFormState>(INITIAL_STATE);

  const list = state.scope === 'certification' ? certifications : publicExams;
  const exam = list.find((candidate) => candidate.id === state.examId) ?? list[0] ?? null;

  const generation = useSimuladoGeneration({ exam, state });
  const availability = useSimuladoAvailability(exam?.id);

  useSimuladoPrefill({
    isLoading,
    certifications,
    publicExams,
    onApply: (next) => {
      setState(next);
      generation.backToConfig();
    },
  });

  useEffect(() => {
    if (isLoading || list.length === 0 || !list[0]?.id) return;
    const isValid = list.some((candidate) => candidate.id === state.examId);

    if (isValid) return;
    setState((prev) => ({ ...prev, ...deriveFromExam(list[0]) }));
  }, [isLoading, list, state.examId]);

  const weights = exam ? sectionWeights(exam.sections) : {};
  const distribution = exam ? distributeQuestions(exam.sections, state.selectedSections, state.totalQuestions) : [];
  const coverage = exam ? coveragePercent(exam.sections, state.selectedSections) : 0;
  const activePreset: PresetKey | null = exam
    ? ((['official', 'quick', 'errors'] as const).find((key) => matchesPreset(key, state, exam)) ?? null)
    : null;
  const countByName = new Map(distribution.map((entry) => [entry.sectionName, entry.questionCount]));

  const availableForSource = (sectionName: string): number | null => {
    const entry = availability?.sections.find((section) => section.sectionName === sectionName);

    return entry ? entry[state.source] : null;
  };

  const topicRows = (exam?.sections ?? []).map((section) => ({
    name: section.name,
    weight: weights[section.name] ?? 0,
    count: countByName.get(section.name) ?? 0,
    available: availableForSource(section.name),
  }));

  const insufficient =
    availability != null &&
    distribution.some((entry) => {
      const avail = availableForSource(entry.sectionName) ?? 0;

      return entry.questionCount > avail;
    });

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
  } else if (insufficient) {
    statusText = t('simulado.create.statusInsufficient');
  } else {
    statusTone = 'ok';
    statusText = t('simulado.create.statusReady', { count: state.totalQuestions, percent: coverage });
  }

  const canCreate = statusTone === 'ok' && hasExam && !generation.isBusy;

  const summaryRows = [
    { label: t('simulado.create.summaryExam'), value: exam?.name ?? '—' },
    { label: t('simulado.create.summaryQuestions'), value: String(state.totalQuestions) },
    { label: t('simulado.create.summaryTime'), value: resolveSummaryTime() },
    { label: t('simulado.create.summarySource'), value: t(SOURCE_TITLE_KEY[state.source]) },
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

  const simuladoName = generation.createdSimulado?.name ?? (state.name.trim() || exam?.name || '');
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
        {generation.phase === 'config' ? (
          <>
            <PresetShortcuts
              activePreset={activePreset}
              officialCount={exam?.totalQuestions ?? 0}
              officialTime={exam?.examDurationMinutes != null ? fmtTempo(exam.examDurationMinutes) : '—'}
              onPick={handlePreset}
            />
            {renderConfigCard()}
          </>
        ) : (
          <GenerationPanel
            isStarting={generation.isStarting}
            phase={generation.phase}
            simuladoName={simuladoName}
            stepIndex={generation.stepIndex}
            summaryLine={summaryLine}
            onCreateAnother={handleCreateAnother}
            onStart={generation.start}
          />
        )}
      </div>

      <SummarySidebar
        canCreate={canCreate}
        footnote={resolveFootnote()}
        isBusy={generation.isBusy}
        notes={notes}
        rows={summaryRows}
        statusText={statusText}
        statusTone={statusTone}
        onCreate={generation.create}
      />
    </div>
  );

  function resolveFootnote(): string | undefined {
    if (generation.phase === 'gerando') return t('simulado.create.generatingFootnote');
    if (generation.phase === 'pronto') return t('simulado.create.readyFootnote');

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

  function handlePreset(key: PresetKey) {
    if (exam) setState(applyPreset(key, state, exam));
  }

  function handleNoSections() {
    patchState({ selectedSections: [] });
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

  function handleCreateAnother() {
    generation.backToConfig();
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

        <SourcePicker
          counts={availability?.totals ?? null}
          value={state.source}
          onChange={(source) => patchState({ source })}
        />

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
