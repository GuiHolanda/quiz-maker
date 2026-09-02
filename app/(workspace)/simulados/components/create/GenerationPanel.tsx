'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faFileCircleCheck } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { IconBadge } from '@/shared/components/ui/IconBadge';
import { StatusPill } from '@/shared/components/ui/StatusPill';

interface GenerationPanelProps {
  readonly phase: 'gerando' | 'pronto';
  readonly stepIndex: number;
  readonly simuladoName: string;
  readonly summaryLine: string;
  readonly onStart: () => void;
  readonly onCreateAnother: () => void;
  readonly isStarting: boolean;
}

type StepState = 'done' | 'active' | 'queued';

const SPINNER =
  'h-3 w-3 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin motion-reduce:animate-none';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;

const STEP_DOT: Record<StepState, string> = {
  done: 'bg-success/15',
  active: 'bg-primary/15',
  queued: 'border border-divider',
};

const STEP_LABEL: Record<StepState, string> = {
  done: 'text-foreground',
  active: 'font-semibold text-foreground',
  queued: 'text-default-400',
};

const STEP_META: Record<StepState, string> = {
  done: 'text-success',
  active: 'text-primary',
  queued: 'text-default-400',
};

const STEP_META_KEY: Record<StepState, string> = {
  done: 'simulado.create.stepDone',
  active: 'simulado.create.stepRunning',
  queued: 'simulado.create.stepQueued',
};

export function GenerationPanel({
  phase,
  stepIndex,
  simuladoName,
  summaryLine,
  onStart,
  onCreateAnother,
  isStarting,
}: GenerationPanelProps) {
  const { t } = useTranslation();

  const isReady = phase === 'pronto';
  const clampedStep = Math.min(stepIndex, 4);
  const progressPercent = (clampedStep / 4) * 100;

  function stepStateAt(index: number): StepState {
    if (isReady || index < stepIndex) return 'done';
    if (index === stepIndex) return 'active';

    return 'queued';
  }

  return (
    <div className="flex flex-col rounded-xl bg-content1 p-6" data-testid="simulado-generation-panel">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={faFileCircleCheck} size="md" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-[17px] font-bold text-foreground">{simuladoName}</span>
            <span className="font-mono text-[11.5px] text-default-400">{summaryLine}</span>
          </div>
        </div>

        <StatusPill size="md" spinner={!isReady} tone={isReady ? 'ok' : 'busy'}>
          {isReady ? t('simulado.create.readyPill') : t('simulado.create.generatingPill')}
        </StatusPill>
      </div>

      <div className="mt-[22px] border-t border-divider pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13.5px] text-default-500">
            {t('simulado.create.progressLabel', { done: clampedStep, total: 4 })}
          </span>
          <span className="font-mono text-xs text-default-400">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-[5px] rounded-full bg-content2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-3.5 flex flex-col">
        {STEP_KEYS.map((key, index) => {
          const state = stepStateAt(index);

          return (
            <div
              key={key}
              className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-divider px-0.5 py-[15px] first:border-t-0"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${STEP_DOT[state]}`}>
                {state === 'done' && <FontAwesomeIcon className="h-3.5 w-3.5 text-success" icon={faCheck} />}
                {state === 'active' && <span className={SPINNER} />}
              </span>

              <span className={`text-[14.5px] ${STEP_LABEL[state]}`}>{t(`simulado.create.${key}`)}</span>

              <span className={`font-mono text-xs ${STEP_META[state]}`}>{t(STEP_META_KEY[state])}</span>
            </div>
          );
        })}
      </div>

      {isReady && (
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            className={buttonStyles.primary}
            data-testid="simulado-generation-start-btn"
            endContent={<FontAwesomeIcon icon={faArrowRight} />}
            isLoading={isStarting}
            onPress={onStart}
          >
            {t('simulado.create.startButton')}
          </Button>
          <Button
            className="rounded-lg border-divider text-default-500 data-[hover=true]:bg-content2 data-[hover=true]:text-foreground"
            data-testid="simulado-generation-create-another-btn"
            isDisabled={isStarting}
            variant="bordered"
            onPress={onCreateAnother}
          >
            {t('simulado.create.createAnother')}
          </Button>
        </div>
      )}
    </div>
  );
}
