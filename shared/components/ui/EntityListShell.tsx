'use client';

import React from 'react';

import { CollapsibleFilterPanel } from '@/shared/components/ui/CollapsibleFilterPanel';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export interface EntityListPaginationConfig {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly itemsPerPage: number;
  readonly onPageChange: (page: number) => void;
  readonly onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface EntityListShellProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly totalItems?: number;
  readonly isLoading?: boolean;
  readonly skeleton?: React.ReactNode;
  readonly emptyState?: React.ReactNode;
  readonly filterContent?: React.ReactNode;
  readonly hasActiveFilters?: boolean;
  readonly onClearFilters?: () => void;
  readonly isFiltersOpen?: boolean;
  readonly onToggleFilters?: () => void;
  readonly sort?: 'asc' | 'desc';
  readonly sortAscLabel?: string;
  readonly sortDescLabel?: string;
  readonly onToggleSort?: () => void;
  readonly children: React.ReactNode;
  readonly pagination?: EntityListPaginationConfig;
  readonly paginationLabel?: string;
}

export function EntityListShell({
  title,
  subtitle,
  totalItems,
  isLoading = false,
  skeleton,
  emptyState,
  filterContent,
  hasActiveFilters = false,
  onClearFilters,
  isFiltersOpen = false,
  onToggleFilters,
  sort,
  sortAscLabel,
  sortDescLabel,
  onToggleSort,
  children,
  pagination,
  paginationLabel = '',
}: EntityListShellProps) {
  const { t } = useTranslation();

  const isEmpty = !isLoading && (totalItems !== undefined ? totalItems === 0 : React.Children.count(children) === 0);

  const countTotal = pagination?.totalItems ?? totalItems ?? 0;
  const countCurrent = pagination
    ? Math.min(pagination.itemsPerPage, pagination.totalItems - (pagination.currentPage - 1) * pagination.itemsPerPage)
    : (totalItems ?? 0);
  const shouldShowCount = countTotal > 0 && !!paginationLabel;

  function renderBody() {
    if (isLoading) {
      return skeleton ?? <SkeletonListLoader />;
    }

    if (isEmpty) {
      if (hasActiveFilters) {
        return (
          <EmptyState
            title={t('common.noResultsForFilters')}
            action={onClearFilters ? { label: t('common.clearFilters'), onPress: onClearFilters } : undefined}
          />
        );
      }

      return emptyState ?? null;
    }

    return children;
  }

  return (
    <div className="flex flex-col gap-4">
      {(title || subtitle || pagination || (filterContent && onToggleFilters) || shouldShowCount) && (
        <div className="flex flex-col gap-2">
          {(title || subtitle) && (
            <div className="flex flex-col gap-0.5">
              {title && <h2 className="text-xl font-bold text-foreground">{title}</h2>}
              {subtitle && <p className="text-sm text-default-500">{subtitle}</p>}
            </div>
          )}
          {(pagination || (filterContent && onToggleFilters) || shouldShowCount) && (
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              {shouldShowCount && (
                <p className="text-xs text-default-500 font-semibold ps-2 flex-1 min-w-0">
                  {pagination
                    ? t('common.paginationItems', { current: countCurrent, total: countTotal, label: paginationLabel })
                    : t('common.paginationItemsTotal', { total: countTotal, label: paginationLabel })}
                </p>
              )}
              {pagination && (
                <ItemsPerPageSelect value={pagination.itemsPerPage} onChange={pagination.onItemsPerPageChange} />
              )}
              {filterContent && onToggleFilters && (
                <CollapsibleFilterPanel
                  hasActiveFilters={hasActiveFilters}
                  isOpen={isFiltersOpen}
                  sort={sort}
                  sortAscLabel={sortAscLabel}
                  sortDescLabel={sortDescLabel}
                  onToggle={onToggleFilters}
                  onToggleSort={onToggleSort}
                >
                  {filterContent}
                </CollapsibleFilterPanel>
              )}
            </div>
          )}
        </div>
      )}

      {renderBody()}

      {!isLoading && !isEmpty && pagination && (
        <div className="flex flex-wrap gap-3 mt-2">
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}
