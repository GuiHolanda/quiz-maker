'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Spinner } from '@heroui/spinner';

import type { AutoConfigStage } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export type SeedStep = 'identify' | 'research' | 'review' | 'format';

const STEP_ORDER: readonly SeedStep[] = ['identify', 'research', 'review', 'format'];

export const STEP_HEADLINE_KEYS: Record<SeedStep, string> = {
  identify: 'exam.loadingStageIdentify',
  research: 'exam.aiSeedStageResearch',
  review: 'exam.aiSeedStageReview',
  format: 'exam.aiSeedStageFormat',
};

const STEP_ROW_KEYS: Record<SeedStep, string> = {
  identify: 'exam.loadingTaskIdentify',
  research: 'exam.loadingTaskResearch',
  review: 'exam.loadingTaskReview',
  format: 'exam.loadingTaskFormat',
};

type StepRowStatus = 'done' | 'active' | 'awaiting' | 'queued';

const STATUS_META_KEYS: Record<StepRowStatus, string> = {
  done: 'exam.loadingTaskDone',
  active: 'exam.loadingTaskActive',
  awaiting: 'exam.loadingTaskAwaiting',
  queued: 'exam.loadingTaskQueued',
};

const STATUS_META_COLORS: Record<StepRowStatus, string> = {
  done: 'text-success',
  active: 'text-primary',
  awaiting: 'text-primary',
  queued: 'text-default-400',
};

export function stepFromStage(stage: AutoConfigStage | null): SeedStep {
  return stage ?? 'identify';
}

interface SeedProgressCardProps {
  readonly variant: 'auto-config' | 'edital';
  readonly step: SeedStep;
  readonly isAwaitingUser?: boolean;
  readonly elapsedLabel: string;
}

export function SeedProgressCard({ variant, step, isAwaitingUser = false, elapsedLabel }: SeedProgressCardProps) {
  const { t } = useTranslation();
  const currentIndex = STEP_ORDER.indexOf(step);
  const completedPct = (currentIndex / STEP_ORDER.length) * 100;

  return (
    <div className="bg-content1 border border-content2 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-default-500">{t('exam.loadingProgressTitle')}</div>
          <div className="text-lg font-bold mt-2">
            {t(isAwaitingUser ? STEP_ROW_KEYS[step] : STEP_HEADLINE_KEYS[step])}
          </div>
        </div>
        <div className="text-right shrink-0">
          {variant === 'auto-config' && (
            <div className="font-mono text-2xl font-medium text-primary">
              {currentIndex + 1}/{STEP_ORDER.length}
            </div>
          )}
          <div className="font-mono text-[11px] text-default-400 mt-0.5">{elapsedLabel}</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-content2 mt-4 overflow-hidden flex">
        {variant === 'auto-config' ? (
          <>
            <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${completedPct}%` }} />
            <div className="w-1/4 h-full overflow-hidden">
              {isAwaitingUser ? null : <div className="w-1/3 h-full bg-primary/40 step-sweep" />}
            </div>
          </>
        ) : (
          <div className="w-full h-full overflow-hidden">
            <div className="w-1/3 h-full bg-primary step-sweep" />
          </div>
        )}
      </div>

      {variant === 'auto-config' && (
        <div className="mt-5 flex flex-col">
          {STEP_ORDER.map((rowStep, i) => {
            const status: StepRowStatus =
              i < currentIndex ? 'done' : i > currentIndex ? 'queued' : isAwaitingUser ? 'awaiting' : 'active';

            return (
              <div
                key={rowStep}
                className={`grid grid-cols-[22px_1fr_auto] gap-3 items-center py-3 border-t border-default-200 ${status === 'queued' ? 'opacity-50' : ''}`}
              >
                <div className="w-[22px] h-[22px] flex items-center justify-center">
                  {status === 'done' && (
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                      <FontAwesomeIcon className="w-3 h-3 text-success" icon={faCheck} />
                    </div>
                  )}
                  {status === 'active' && <Spinner size="sm" />}
                  {status === 'awaiting' && <div className="w-[7px] h-[7px] rounded-full bg-primary" />}
                  {status === 'queued' && <div className="w-[7px] h-[7px] rounded-full bg-default-200" />}
                </div>
                <div
                  className={`text-sm ${status === 'queued' ? 'text-default-500' : 'font-semibold text-foreground'}`}
                >
                  {t(STEP_ROW_KEYS[rowStep])}
                </div>
                <div className={`font-mono text-[11px] ${STATUS_META_COLORS[status]}`}>
                  {t(STATUS_META_KEYS[status])}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
