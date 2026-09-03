import type { ReactNode } from 'react';

interface ProgressTrackProps {
  readonly value: number;
  readonly fillClass?: string;
  readonly trackClass?: string;
  readonly heightClass?: string;
  readonly animated?: boolean;
  readonly overflowVisible?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}

export function ProgressTrack({
  value,
  fillClass = 'bg-primary',
  trackClass = 'bg-default-200',
  heightClass = 'h-1.5',
  animated = false,
  overflowVisible = false,
  className,
  children,
}: ProgressTrackProps) {
  const width = Math.max(0, Math.min(100, value));
  const trackClasses = [
    heightClass,
    trackClass,
    'relative rounded-full',
    overflowVisible ? '' : 'overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const fillClasses = [
    'h-full rounded-full',
    fillClass,
    animated ? 'transition-[width] duration-500 motion-reduce:transition-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={trackClasses}>
      <div className={fillClasses} style={{ width: `${width}%` }} />
      {children}
    </div>
  );
}
