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
  paginationLabel = 'items',
}: EntityListShellProps) {
  const { t } = useTranslation();

  const isEmpty = !isLoading && (totalItems !== undefined ? totalItems === 0 : React.Children.count(children) === 0);

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
      {(title || subtitle || pagination) && (
        <div className="flex flex-col gap-2 flex-wrap">
          {(title || subtitle) && (
            <div className="flex flex-col gap-0.5">
              {title && <h2 className="text-xl font-bold text-foreground">{title}</h2>}
              {subtitle && <p className="text-sm text-default-500">{subtitle}</p>}
            </div>
          )}
          {pagination && (
            <div className="flex justify-between items-end">
              <p className="text-sm text-default-500 font-semibold">
                {t('common.paginationItems', {
                  current: Math.min(
                    pagination.itemsPerPage,
                    pagination.totalItems - (pagination.currentPage - 1) * pagination.itemsPerPage
                  ),
                  total: pagination.totalItems,
                  label: paginationLabel,
                })}
              </p>
              <ItemsPerPageSelect value={pagination.itemsPerPage} onChange={pagination.onItemsPerPageChange} />
            </div>
          )}
        </div>
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
