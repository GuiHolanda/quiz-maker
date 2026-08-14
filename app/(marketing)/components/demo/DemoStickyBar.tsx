'use client';

import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

interface DemoStickyBarProps {
  readonly leftLabel: string;
  readonly leftAccent?: boolean;
  readonly rightHint: string;
  readonly buttonLabel: string;
  readonly buttonDisabled: boolean;
  readonly onAction: () => void;
}

export function DemoStickyBar({
  leftLabel,
  leftAccent = false,
  rightHint,
  buttonLabel,
  buttonDisabled,
  onAction,
}: DemoStickyBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-mkt-divider bg-mkt-bg">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <span
          className={`mono text-xs px-2 py-1 border ${
            leftAccent
              ? 'border-mkt-accent bg-mkt-accent/10 text-mkt-accent'
              : 'border-mkt-divider text-mkt-text opacity-60'
          }`}
        >
          {leftLabel}
        </span>

        <div className="flex items-center gap-4 ml-auto">
          <span className="mono text-xs text-mkt-text opacity-40 hidden sm:block">{rightHint}</span>

          <div className="relative">
            <BlueprintCorners />
            <button
              onClick={onAction}
              disabled={buttonDisabled}
              className={`mono text-xs uppercase tracking-widest px-5 py-2.5 border transition-colors ${
                buttonDisabled
                  ? 'border-mkt-divider text-mkt-text opacity-30 cursor-not-allowed'
                  : 'border-mkt-accent bg-mkt-accent text-white hover:bg-mkt-accent/90'
              }`}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
