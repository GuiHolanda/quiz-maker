import type { ReactNode } from 'react';

import { type SplitVariant, splitLayoutClasses, splitRailClasses } from './splitLayout';

interface WorkspaceSplitLayoutProps {
  readonly children: ReactNode;
  readonly rail: ReactNode;
  readonly variant?: SplitVariant;
  readonly stickyRail?: boolean;
}

export function WorkspaceSplitLayout({
  children,
  rail,
  variant = 'summary',
  stickyRail = false,
}: WorkspaceSplitLayoutProps) {
  const { outer, main } = splitLayoutClasses(variant);

  return (
    <div className={outer}>
      <div className={main}>{children}</div>
      <div className={splitRailClasses(stickyRail)}>{rail}</div>
    </div>
  );
}
