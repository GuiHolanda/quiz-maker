'use client';

import React from 'react';
import { Chip } from '@heroui/chip';

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
  readonly title: string;
  readonly totalItems?: number;
  readonly isLoading?: boolean;
  readonly skeleton?: React.ReactNode;
  readonly emptyState?: React.ReactNode;
  readonly filterContent?: React.ReactNode;
  readonly hasActiveFilters?: boolean;
  readonly onClearFilters?: () => void;
  readonly isFiltersOpen?: boolean;
  readonly onToggleFilters?: () => void;
  readonly children: React.ReactNode;
  readonly pagination?: EntityListPaginationConfig;
}

export function EntityListShell({
  title,
  totalItems,
  isLoading = false,
  skeleton,
  emptyState,
  filterContent,
  hasActiveFilters = false,
  onClearFilters,
  isFiltersOpen = false,
  onToggleFilters,
  children,
  pagination,
}: EntityListShellProps) {
  const { t } = useTranslation();

  const isEmpty = !isLoading && React.Children.count(children) === 0;

  function renderBody() {
    if (isLoading) {
      return skeleton ?? <SkeletonListLoader />;
    }

    if (isEmpty) {
      if (hasActiveFilters) {
        return (
          <EmptyState
            title={t('common.noResultsForFilters')}
            action={
              onClearFilters
                ? { label: t('common.clearFilters'), onPress: onClearFilters }
                : undefined
            }
          />
        );
      }

      return emptyState ?? <EmptyState title={t('common.noResultsForFilters')} />;
    }

    return children;
  }

  return (
    <div className="flex flex-col gap-4">
      {title && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {totalItems !== undefined && (
            <Chip size="sm" variant="flat">
              {totalItems}
            </Chip>
          )}
        </div>
      )}

      {filterContent && onToggleFilters && (
        <CollapsibleFilterPanel
          hasActiveFilters={hasActiveFilters}
          isOpen={isFiltersOpen}
          onToggle={onToggleFilters}
        >
          {filterContent}
        </CollapsibleFilterPanel>
      )}

      {renderBody()}

      {!isLoading && !isEmpty && pagination && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChange={pagination.onPageChange}
          />
          <ItemsPerPageSelect
            value={pagination.itemsPerPage}
            onChange={pagination.onItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}
