import type { ReactNode } from 'react';

interface ProgressTrackProps {
  readonly value: number;
  readonly fillClass?: string;
  readonly trackClass?: string;
  readonly heightClass?: string;
  readonly animated?: boolean;
  readonly overflowVisible?: boolean;
  readonly markerPercent?: number | null;
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
  markerPercent = null,
  className,
  children,
}: ProgressTrackProps) {
  const width = Math.max(0, Math.min(100, value));
  const trackClasses = [
    heightClass,
    trackClass,
    'relative rounded-full',
    overflowVisible || markerPercent != null ? '' : 'overflow-hidden',
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
      {markerPercent != null && (
        <div
          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 bg-primary"
          style={{ left: `clamp(1px, ${Math.max(0, Math.min(100, markerPercent))}%, calc(100% - 1px))` }}
        />
      )}
      {children}
    </div>
  );
}
