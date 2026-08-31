'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faFileCircleCheck,
  faPause,
  faPlay,
  faStopwatch,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { formatMMSS } from './attemptFormat';

interface AttemptTopBarProps {
  readonly title: string;
  readonly metaLine: string;
  readonly timed: boolean;
  readonly remainingMs: number;
  readonly remainingLabel: string;
  readonly critical: boolean;
  readonly paused: boolean;
  readonly progressPercent: number;
  readonly onTogglePause: () => void;
  readonly onExit: () => void;
}

function announcement(remainingMs: number, timedOutLabel: string, remainingTemplate: (time: string) => string): string {
  if (remainingMs <= 0) return timedOutLabel;
  if (remainingMs <= 60_000) return remainingTemplate('01:00');
  if (remainingMs <= 5 * 60_000) return remainingTemplate('05:00');
  return '';
}

export function AttemptTopBar({
  title,
  metaLine,
  timed,
  remainingMs,
  remainingLabel,
  critical,
  paused,
  progressPercent,
  onTogglePause,
  onExit,
}: AttemptTopBarProps) {
  const { t } = useTranslation();

  const pillTone = critical
    ? 'bg-danger/10 border-danger/40 text-danger'
    : 'bg-content2 border-divider text-foreground';
  const liveMessage = timed
    ? announcement(remainingMs, t('simulado.result.timedOut'), (time) => t('simulado.timer.remaining', { time }))
    : '';

  return (
    <header className="sticky top-0 z-10 bg-background border-b border-divider">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 md:px-12">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FontAwesomeIcon className="text-sm" icon={faFileCircleCheck} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-foreground">{title}</h1>
            <p className="mt-0.5 hidden truncate font-mono text-[11px] text-default-400 sm:block">{metaLine}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {timed && (
            <>
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 sm:gap-2 sm:px-3.5 sm:py-2 ${pillTone} ${
                  critical && !paused ? 'animate-pulse' : ''
                }`}
              >
                <FontAwesomeIcon className="text-xs" icon={faStopwatch} />
                <span className="font-mono text-sm font-semibold tabular-nums" data-testid="simulado-timer">
                  {paused ? formatMMSS(remainingMs) : remainingLabel}
                </span>
              </div>
              <Button
                isIconOnly
                aria-label={paused ? t('simulado.attempt.resume') : t('simulado.attempt.pause')}
                aria-pressed={paused}
                className={`${buttonStyles.iconOnly.neutral} rounded-lg border border-divider hover:bg-content2`}
                size="sm"
                variant="light"
                onPress={onTogglePause}
              >
                <FontAwesomeIcon icon={paused ? faPlay : faPause} />
              </Button>
            </>
          )}
          <Button
            isIconOnly
            aria-label={t('simulado.attempt.exit')}
            className={`${buttonStyles.iconOnly.neutral} rounded-lg border border-divider hover:bg-content2 sm:hidden`}
            size="sm"
            variant="light"
            onPress={onExit}
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </Button>
          <Button
            className={`${buttonStyles.secondarySm} hidden sm:flex`}
            data-testid="attempt-exit-btn"
            size="sm"
            startContent={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
            variant="bordered"
            onPress={onExit}
          >
            {t('simulado.attempt.exit')}
          </Button>
        </div>
      </div>

      <div className="h-[3px] bg-content2">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <span aria-live="polite" className="sr-only">
        {liveMessage}
      </span>
    </header>
  );
}
