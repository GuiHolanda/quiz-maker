import type { ReactNode } from 'react';

interface PageHeaderProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly breadcrumbs?: ReactNode;
  readonly action?: ReactNode;
  readonly children?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, action, children }: PageHeaderProps) {
  return (
    <div className="app-bg">
      <div className="w-full px-12 py-12">
        {breadcrumbs && <div className="mb-3">{breadcrumbs}</div>}
        {(title || action) && (
          <div className="flex items-end justify-between mb-8 gap-4">
            <div className="flex flex-col gap-1.5">
              {title && <h1 className="page-header-title">{title}</h1>}
              {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
