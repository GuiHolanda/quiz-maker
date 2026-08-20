'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import type { AutoConfigStage, ExamType } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { NewExamHeader } from './NewExamHeader';
import { NextStepsCard } from './NextStepsCard';
import { SeedProgressCard, STAGE_HEADLINE_KEYS } from './SeedProgressCard';
import { SeedModulesSkeleton } from './SeedModulesSkeleton';
import { SeedExtractionLog, type LogLine } from './SeedExtractionLog';

export type SeedLoadingVariant =
  | {
      readonly kind: 'auto-config';
      readonly examName: string;
      readonly provider: string;
      readonly stage: AutoConfigStage | null;
    }
  | { readonly kind: 'edital'; readonly fileName: string };

interface SeedLoadingScreenProps {
  readonly type: ExamType;
  readonly startedAt: number;
  readonly variant: SeedLoadingVariant;
  readonly onCancel: () => void;
}

interface StageLogEntry {
  readonly stage: AutoConfigStage;
  readonly time: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Fills the wait between confirming a seed and the editor mounting. Two variants share this
// frame: the auto-config pipeline (3 real SSE-tracked stages) and edital extraction (one
// opaque HTTP call — reduced to elapsed time + an indeterminate bar, no stage list).
export function SeedLoadingScreen({ type, startedAt, variant, onCancel }: SeedLoadingScreenProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, []);

  const elapsedLabel = formatElapsed(now - startedAt);
  const currentStage = variant.kind === 'auto-config' ? variant.stage : null;

  // One entry per stage transition actually observed this session. On reconnect mid-job,
  // earlier stages are simply absent rather than backfilled with a guessed timestamp.
  const [stageLog, setStageLog] = useState<readonly StageLogEntry[]>([]);

  useEffect(() => {
    if (!currentStage) return;
    setStageLog((prev) =>
      prev.some((entry) => entry.stage === currentStage)
        ? prev
        : [...prev, { stage: currentStage, time: formatElapsed(Date.now() - startedAt) }]
    );
  }, [currentStage, startedAt]);

  const startLine: LogLine =
    variant.kind === 'auto-config'
      ? { time: '00:00', text: t('exam.loadingLogStarted', { name: variant.examName }) }
      : { time: '00:00', text: t('exam.loadingLogEditalStarted', { file: variant.fileName }) };

  const logLines: LogLine[] = [
    startLine,
    ...stageLog.map((entry) => ({ time: entry.time, text: t(STAGE_HEADLINE_KEYS[entry.stage]) })),
  ];

  const title =
    variant.kind === 'auto-config' ? t('exam.loadingTitle', { name: variant.examName }) : t('exam.loadingEditalTitle');
  const subtitle =
    variant.kind === 'auto-config'
      ? variant.provider
        ? t('exam.loadingSubtitle', { provider: variant.provider })
        : t('exam.loadingSubtitleGeneric')
      : t('exam.loadingEditalSubtitle', { file: variant.fileName });

  return (
    <>
      <NewExamHeader
        activeStep={2}
        isStepRunning
        stepLabel={t('exam.loadingStepIndicator')}
        subtitle={subtitle}
        title={title}
        onCancel={onCancel}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mt-7">
        <div className="flex flex-col gap-4">
          <SeedProgressCard elapsedLabel={elapsedLabel} stage={currentStage} variant={variant.kind} />
          <SeedModulesSkeleton type={type} />
        </div>

        <div className="flex flex-col gap-4">
          <NextStepsCard />
          <SeedExtractionLog currentTimeLabel={elapsedLabel} lines={logLines} />

          {variant.kind === 'auto-config' && (
            <div className="bg-content1 border border-default-200 rounded-xl p-5">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faArrowRightFromBracket} />
                <div className="text-sm font-semibold text-foreground">{t('exam.loadingKeepGoingTitle')}</div>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-default-500">{t('exam.loadingKeepGoingBody')}</p>
            </div>
          )}

          <div className="bg-content1 border border-default-200 rounded-xl p-5">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faShieldHalved} />
              <div className="text-sm font-semibold text-foreground">{t('exam.loadingSourceTitle')}</div>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-default-500">{t('exam.loadingSourceBody')}</p>
          </div>
        </div>
      </div>
    </>
  );
}
