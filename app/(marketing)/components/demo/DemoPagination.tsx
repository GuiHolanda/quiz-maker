'use client';

interface DemoPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly prevLabel: string;
  readonly nextLabel: string;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export function DemoPagination({
  page,
  totalPages,
  onPageChange,
  prevLabel,
  nextLabel,
  className = '',
  children,
}: DemoPaginationProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="mono text-xs text-mkt-text opacity-75 font-bold hover:opacity-100 border border-mkt-divider py-2 px-4 disabled:opacity-20 transition-opacity tracking-tighter"
      >
        ← {prevLabel}
      </button>
      {children}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="mono text-xs text-mkt-text font-bold opacity-75 border border-mkt-divider py-2 px-4 hover:opacity-100 disabled:opacity-20 transition-opacity tracking-tighter"
      >
        {nextLabel} →
      </button>
    </div>
  );
}
