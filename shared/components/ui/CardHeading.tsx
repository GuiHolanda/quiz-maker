import type { ReactNode } from 'react';

interface CardHeadingProps {
  readonly children: ReactNode;
  readonly subtitle?: ReactNode;
  readonly icon?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function CardHeading({ children, subtitle, icon, action, className }: CardHeadingProps) {
  return (
    <div className={['flex items-start justify-between gap-3', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold text-primary">
          {icon}
          {children}
        </p>
        {subtitle && <p className="mt-0.5 text-[11px] text-default-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
