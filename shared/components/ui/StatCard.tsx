import type { ReactNode } from 'react';

interface StatCardProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly detail?: ReactNode;
  readonly action?: ReactNode;
  readonly value?: ReactNode;
  readonly valueClassName?: string;
  readonly suffix?: ReactNode;
  readonly footer?: ReactNode;
  readonly muted?: boolean;
  readonly className?: string;
  readonly testId?: string;
}

const DEFAULT_VALUE_CLASS = 'font-bold text-foreground text-2xl leading-none';

export function StatCard({
  icon,
  label,
  detail,
  action,
  value,
  valueClassName,
  suffix,
  footer,
  muted = false,
  className,
  testId,
}: StatCardProps) {
  const shell = [
    'bg-content1 rounded-xl border border-default-200 dark:border-transparent p-5',
    muted ? 'opacity-50' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shell} data-testid={testId}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy-400">{label}</p>
            {detail != null && <p className="font-mono text-[9px] text-default-400 leading-tight mt-0.5">{detail}</p>}
          </div>
        </div>
        {action}
      </div>

      {value != null && (
        <div className="flex items-baseline gap-2">
          <span className={valueClassName ?? DEFAULT_VALUE_CLASS}>{value}</span>
          {suffix != null && <span className="text-sm text-default-500">{suffix}</span>}
        </div>
      )}

      {footer}
    </div>
  );
}
