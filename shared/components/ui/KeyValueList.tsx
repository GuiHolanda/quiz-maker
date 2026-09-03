import type { ReactNode } from 'react';

export type KeyValueTone = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';

export interface KeyValueRow {
  readonly label: string;
  readonly value: ReactNode;
  readonly tone?: KeyValueTone;
}

const TONE_CLASS: Record<KeyValueTone, string> = {
  default: 'text-foreground',
  muted: 'text-default-400',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

interface KeyValueListProps {
  readonly rows: ReadonlyArray<KeyValueRow>;
  readonly mono?: boolean;
  readonly className?: string;
}

export function KeyValueList({ rows, mono = false, className }: KeyValueListProps) {
  return (
    <dl className={['flex flex-col', className].filter(Boolean).join(' ')}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-4 border-t border-divider py-2.5 first:border-t-0"
        >
          <dt className="shrink-0 text-sm text-default-500">{row.label}</dt>
          <dd
            className={['text-right text-sm font-semibold', mono ? 'font-mono' : '', TONE_CLASS[row.tone ?? 'default']]
              .filter(Boolean)
              .join(' ')}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
