import type { ReactNode } from 'react';

import { statusPillToneClasses, statusPillSizeClasses, type Size, type StatusTone } from './tone';

interface StatusPillProps {
  readonly tone: StatusTone;
  readonly children: ReactNode;
  readonly size?: Size;
  readonly spinner?: boolean;
  readonly className?: string;
  readonly 'data-testid'?: string;
}

export function StatusPill({
  tone,
  children,
  size = 'sm',
  spinner = false,
  className,
  'data-testid': testId,
}: StatusPillProps) {
  const classes = [
    'inline-flex shrink-0 items-center gap-2 rounded-full border',
    statusPillSizeClasses(size),
    statusPillToneClasses(tone),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} data-testid={testId}>
      {spinner && (
        <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
      )}
      {children}
    </span>
  );
}
