'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { NavigatorItem, NavigatorStatus } from './useAttemptRunner.hook';

interface AttemptNavigatorCardProps {
  readonly items: NavigatorItem[];
  readonly percentLabel: string;
  readonly currentNumber: number;
  readonly counts: { answered: number; skipped: number; unvisited: number };
  readonly onJump: (index: number) => void;
}

const CELL_TONE: Record<NavigatorStatus, string> = {
  current: 'border-primary bg-primary/[0.16] text-primary',
  answered: 'border-success/35 bg-success/10 text-success',
  skipped: 'border-primary/30 bg-primary/[0.06] text-primary',
  unvisited: 'border-divider text-default-500',
};

const SWATCH_TONE: Record<'answered' | 'skipped' | 'unvisited' | 'current', string> = {
  answered: 'border-success/35 bg-success/10',
  skipped: 'border-primary/30 bg-primary/[0.06]',
  unvisited: 'border-divider',
  current: 'border-primary bg-primary/[0.16]',
};

export function AttemptNavigatorCard({
  items,
  percentLabel,
  currentNumber,
  counts,
  onJump,
}: AttemptNavigatorCardProps) {
  const { t } = useTranslation();

  const statusText = (item: NavigatorItem) => {
    if (item.status === 'current') return t('simulado.attempt.legendCurrent');
    if (item.answered) return t('simulado.attempt.statusAnswered');
    if (item.status === 'skipped') return t('simulado.attempt.statusSkipped');
    return t('simulado.attempt.statusUnanswered');
  };

  const legend: { key: 'answered' | 'skipped' | 'unvisited' | 'current'; label: string; count: number; fg: string }[] =
    [
      { key: 'answered', label: t('simulado.attempt.legendAnswered'), count: counts.answered, fg: 'text-success' },
      { key: 'skipped', label: t('simulado.attempt.legendSkipped'), count: counts.skipped, fg: 'text-primary' },
      {
        key: 'unvisited',
        label: t('simulado.attempt.legendUnvisited'),
        count: counts.unvisited,
        fg: 'text-default-500',
      },
      { key: 'current', label: t('simulado.attempt.legendCurrent'), count: currentNumber, fg: 'text-primary' },
    ];

  return (
    <div className="rounded-xl border border-divider bg-content1 p-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs font-semibold text-default-400">{t('simulado.attempt.navigator')}</span>
        <span className="font-mono text-[11px] text-default-400">{percentLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-8 gap-1.5">
        {items.map((item) => (
          <button
            key={item.n}
            aria-current={item.status === 'current' ? 'true' : undefined}
            aria-label={t('simulado.attempt.navCellLabel', { n: item.n, status: statusText(item) })}
            className={`grid aspect-square place-items-center rounded-md border font-mono text-xs transition-colors duration-200 hover:border-primary/60 ${CELL_TONE[item.status]}`}
            data-testid="attempt-nav-cell"
            type="button"
            onClick={() => onJump(item.n - 1)}
          >
            {item.n}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-divider pt-4">
        {legend.map((row) => (
          <div key={row.key} className="flex items-center gap-2.5">
            <span className={`h-3.5 w-3.5 shrink-0 rounded border ${SWATCH_TONE[row.key]}`} />
            <span className="text-xs text-default-500">{row.label}</span>
            <span className={`ml-auto font-mono text-xs ${row.fg}`}>{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
