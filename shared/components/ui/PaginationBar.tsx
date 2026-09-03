'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { paginationRange } from '@/shared/components/ui/paginate';

interface PaginationBarProps {
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
  readonly perPage: number;
  readonly itemLabel: string;
  readonly onPageChange: (page: number) => void;
  readonly className?: string;
}

export function PaginationBar({
  page,
  totalPages,
  total,
  perPage,
  itemLabel,
  onPageChange,
  className,
}: PaginationBarProps) {
  const { t } = useTranslation();
  const { from, to } = paginationRange(page, perPage, total);

  const classes = ['flex flex-wrap items-center justify-between gap-4', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <span className="font-mono text-xs text-default-400">
        {t('common.paginationRange', { from, to, total, label: itemLabel })}
      </span>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <PaginationControls currentPage={page} totalPages={totalPages} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
