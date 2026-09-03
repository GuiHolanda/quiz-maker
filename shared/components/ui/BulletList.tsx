import type { ReactNode } from 'react';

interface BulletListItem {
  readonly key?: string;
  readonly leading: ReactNode;
  readonly title?: ReactNode;
  readonly body: ReactNode;
}

interface BulletListProps {
  readonly items: readonly BulletListItem[];
  readonly gap?: 'sm' | 'md';
  readonly className?: string;
}

export function BulletList({ items, gap = 'md', className }: BulletListProps) {
  const gapClass = gap === 'sm' ? 'gap-3' : 'gap-4';

  return (
    <div className={['flex flex-col', gapClass, className].filter(Boolean).join(' ')}>
      {items.map((item, index) => (
        <div key={item.key ?? index} className="flex items-start gap-3">
          <div className="shrink-0">{item.leading}</div>
          <div className="min-w-0">
            {item.title != null && <div className="text-sm font-semibold text-foreground">{item.title}</div>}
            <p
              className={`text-[13px] leading-relaxed text-default-500 text-pretty${item.title != null ? ' mt-1' : ''}`}
            >
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
