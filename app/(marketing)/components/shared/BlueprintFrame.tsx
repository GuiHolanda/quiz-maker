import type { ReactNode } from 'react';

import { BlueprintCorners } from './BlueprintCorners';

interface BlueprintFrameProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly dark?: boolean;
}

// Owns both halves of the pattern: the `.blueprint` box (border plus the
// positioning context the corners anchor to) and the corners themselves. Using
// this instead of a hand-rolled `relative border` + <BlueprintCorners /> is what
// keeps the two from being paired incorrectly.
export function BlueprintFrame({ children, className = '', dark }: BlueprintFrameProps) {
  return (
    <div className={`blueprint overflow-visible ${className}`.trim()}>
      <BlueprintCorners dark={dark} />
      {children}
    </div>
  );
}
