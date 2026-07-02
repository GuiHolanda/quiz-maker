import type { ReactNode } from 'react';
import { Divider } from '@heroui/divider';

interface StyleGuideSectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function StyleGuideSection({ title, children }: StyleGuideSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold text-primary">{title}</h2>
        <Divider />
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}
