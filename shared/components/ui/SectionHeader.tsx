'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface SectionHeaderProps {
  readonly icon: IconDefinition;
  readonly title: string;
  readonly label?: string;
  readonly subtitle?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

export function SectionHeader({ icon, title, label, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={['flex items-start gap-3', className].filter(Boolean).join(' ')}>
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={icon} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {label && <p className="text-sm font-semibold text-primary mt-0.5 truncate">{label}</p>}
        {subtitle && <p className="text-sm text-default-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
