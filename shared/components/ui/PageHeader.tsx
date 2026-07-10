import type { ReactNode } from 'react';

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly maxWidth?: '4xl' | '7xl';
  readonly children?: ReactNode;
}

export function PageHeader({ title, subtitle, maxWidth = '7xl', children }: PageHeaderProps) {
  return (
    <div className="app-bg">
      <div className={`container mx-auto pt-8 pb-12`}>
        <div className="flex flex-col mb-8 gap-1.5">
          <h1 className="page-header-title">{title}</h1>
          <p className="page-header-subtitle">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
