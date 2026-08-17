'use client';

interface DemoProgressBarProps {
  readonly pct: number;
  readonly barColor?: string;
  readonly className?: string;
}

export function DemoProgressBar({ pct, barColor = 'bg-mkt-accent', className = '' }: DemoProgressBarProps) {
  return (
    <div className={`bg-mkt-divider ${className}`}>
      <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
