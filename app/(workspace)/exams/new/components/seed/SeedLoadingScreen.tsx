'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import type { AutoConfigMatch, AutoConfigStage, EditalCandidate, ExamType } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { NewExamHeader } from './NewExamHeader';
import { NextStepsCard } from './NextStepsCard';
import { SeedProgressCard, STEP_HEADLINE_KEYS, stepFromStage, type SeedStep } from './SeedProgressCard';
import { SeedModulesSkeleton } from './SeedModulesSkeleton';
import { SeedIdentifyCard, type ConfirmedSeed, type IdentifyPhase } from './SeedIdentifyCard';
import { SeedExtractionLog, type LogLine } from './SeedExtractionLog';

export type SeedLoadingVariant =
  | {
      readonly kind: 'identify';
      readonly query: string;
      readonly phase: Exclude<IdentifyPhase, { kind: 'confirmed' }>;
    }
  | {
      readonly kind: 'auto-config';
      readonly seed: ConfirmedSeed;
      readonly stage: AutoConfigStage | null;
    }
  | { readonly kind: 'edital'; readonly fileName: string };

interface SeedLoadingScreenProps {
  readonly type: ExamType;
  readonly startedAt: number;
  readonly variant: SeedLoadingVariant;
  readonly onCancel: () => void;
  readonly onSelectMatch?: (match: AutoConfigMatch) => void;
  readonly onRetry?: (query: string) => void;
  readonly onStartBlank?: () => void;
  readonly onSelectRole?: (role: string) => void;
  readonly onApproveEdital?: (candidate: EditalCandidate) => void;
  readonly onRelocateEdital?: (editalKey: string) => void;
  readonly onSkipEdital?: () => void;
}

// Busy sub-phases of the 'identify' variant — the elapsed clock keeps running and the card
// shows a skeleton, same as the top-level 'searching' phase. Every other identify phase is
// interactive (waiting on the user), which stops the clock and swaps the card for a decision.
const BUSY_IDENTIFY_PHASES = new Set(['searching', 'locating']);

interface StepLogEntry {
  readonly step: SeedStep;
  readonly time: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function SeedLoadingScreen({
  type,
  startedAt,
  variant,
  onCancel,
  onSelectMatch,
  onRetry,
  onStartBlank,
  onSelectRole,
  onApproveEdital,
  onRelocateEdital,
  onSkipEdital,
}: SeedLoadingScreenProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  const isAwaitingUser = variant.kind === 'identify' && !BUSY_IDENTIFY_PHASES.has(variant.phase.kind);

  useEffect(() => {
    if (isAwaitingUser) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [isAwaitingUser]);

  const elapsedLabel = formatElapsed(now - startedAt);
  const step: SeedStep =
    variant.kind === 'auto-config'
      ? stepFromStage(variant.stage, type)
      : variant.kind === 'identify' &&
          (variant.phase.kind === 'locating' ||
            variant.phase.kind === 'approving-edital' ||
            variant.phase.kind === 'selecting-role')
        ? 'locate'
        : 'identify';

  const [stepLog, setStepLog] = useState<readonly StepLogEntry[]>([]);
  const loggedStep = variant.kind === 'auto-config' ? (variant.stage as SeedStep | null) : null;

  useEffect(() => {
    if (!loggedStep) return;
    setStepLog((prev) =>
      prev.some((entry) => entry.step === loggedStep)
        ? prev
        : [...prev, { step: loggedStep, time: formatElapsed(Date.now() - startedAt) }]
    );
  }, [loggedStep, startedAt]);

  const logLines: LogLine[] = [
    startLogLine(),
    ...stepLog.map((e) => ({ time: e.time, text: t(STEP_HEADLINE_KEYS[e.step]) })),
  ];

  return (
    <>
      <NewExamHeader
        activeStep={2}
        isStepRunning={!isAwaitingUser}
        stepLabel={t('exam.loadingStepIndicator')}
        subtitle={subtitle()}
        title={title()}
        onCancel={onCancel}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_560px] gap-6 items-start mt-7">
        <div className="flex flex-col gap-4">
          <SeedProgressCard
            elapsedLabel={elapsedLabel}
            isAwaitingUser={isAwaitingUser}
            step={step}
            type={type}
            variant={variant.kind === 'edital' ? 'edital' : 'auto-config'}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
            {variant.kind === 'edital' ? (
              <SeedModulesSkeleton type={type} />
            ) : variant.kind === 'identify' ? (
              <SeedIdentifyCard
                phase={variant.phase}
                query={variant.query}
                type={type}
                onApproveEdital={onApproveEdital}
                onRelocateEdital={onRelocateEdital}
                onRetry={onRetry}
                onSelectMatch={onSelectMatch}
                onSelectRole={onSelectRole}
                onSkipEdital={onSkipEdital}
                onStartBlank={onStartBlank}
              />
            ) : (
              <SeedIdentifyCard phase={{ kind: 'confirmed', match: variant.seed }} query="" type={type} />
            )}

            <div className="bg-content1 border border-content2 rounded-xl p-5 h-fit">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faShieldHalved} />
                <div className="text-sm font-semibold text-foreground">{t('exam.loadingSourceTitle')}</div>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-default-500">{t('exam.loadingSourceBody')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <NextStepsCard />
          <SeedExtractionLog currentTimeLabel={elapsedLabel} lines={logLines} />

          {variant.kind === 'auto-config' && (
            <div className="bg-content1 border border-content2 rounded-xl p-5">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faArrowRightFromBracket} />
                <div className="text-sm font-semibold text-foreground">{t('exam.loadingKeepGoingTitle')}</div>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-default-500">{t('exam.loadingKeepGoingBody')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  function title(): string {
    switch (variant.kind) {
      case 'identify':
        switch (variant.phase.kind) {
          case 'disambiguating':
            return t('exam.aiSeedDisambiguateTitle');
          case 'clarifying':
            return t('exam.aiSeedClarifyingTitle');
          case 'failed':
            return t('exam.loadingFailedTitle');
          case 'selecting-role':
            return t('exam.identifyRoleTitle');
          case 'locating':
            return t('exam.loadingLocatingTitle');
          case 'approving-edital':
            return t('exam.editalApproveTitle');
          default:
            return t('exam.loadingIdentifyTitle', { query: variant.query });
        }
      case 'auto-config':
        return t('exam.loadingTitle', { name: variant.seed.label });
      case 'edital':
        return t('exam.loadingEditalTitle');
    }
  }

  function subtitle(): string {
    switch (variant.kind) {
      case 'identify':
        switch (variant.phase.kind) {
          case 'disambiguating':
            return t('exam.loadingDisambiguateSubtitle');
          case 'clarifying':
            return t('exam.loadingClarifySubtitle');
          case 'failed':
            return t('exam.loadingFailedSubtitle');
          case 'selecting-role':
            return t('exam.identifyRoleSubtitle');
          case 'locating':
            return t('exam.loadingLocatingSubtitle');
          case 'approving-edital':
            return t('exam.editalApproveSubtitle');
          default:
            return t('exam.loadingIdentifySubtitle');
        }
      case 'auto-config': {
        const organization = variant.seed.provider ?? variant.seed.examBoard;

        return organization ? t('exam.loadingSubtitle', { provider: organization }) : t('exam.loadingSubtitleGeneric');
      }
      case 'edital':
        return t('exam.loadingEditalSubtitle', { file: variant.fileName });
    }
  }

  function startLogLine(): LogLine {
    switch (variant.kind) {
      case 'identify':
        return { time: '00:00', text: t('exam.loadingLogIdentifyStarted', { query: variant.query }) };
      case 'auto-config':
        return { time: '00:00', text: t('exam.loadingLogIdentifyDone', { name: variant.seed.label }) };
      case 'edital':
        return { time: '00:00', text: t('exam.loadingLogEditalStarted', { file: variant.fileName }) };
    }
  }
}
