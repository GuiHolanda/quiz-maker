'use client';

interface DemoBackButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly className?: string;
}

export function DemoBackButton({ label, onClick, className = '' }: DemoBackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`mono text-xs text-mkt-accent uppercase tracking-widest hover:opacity-70 transition-opacity ${className}`}
    >
      ← {label}
    </button>
  );
}
