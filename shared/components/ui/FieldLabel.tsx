import type { ReactNode } from 'react';

interface FieldLabelProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function FieldLabel({ children, className }: FieldLabelProps) {
  return (
    <span className={['text-xs font-semibold text-default-400', className].filter(Boolean).join(' ')}>{children}</span>
  );
}
