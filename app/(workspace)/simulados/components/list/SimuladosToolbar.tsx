'use client';

import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { SortSelect } from '@/shared/components/ui/SortSelect';

interface SimuladosToolbarProps {
  readonly search: string;
  readonly onSearch: (v: string) => void;
  readonly examOptions: string[];
  readonly exam: string;
  readonly onExam: (v: string) => void;
  readonly status: 'all' | 'pending' | 'in_progress' | 'answered';
  readonly onStatus: (v: SimuladosToolbarProps['status']) => void;
  readonly sort: 'recent' | 'oldest' | 'bestScore' | 'name';
  readonly onSort: (v: SimuladosToolbarProps['sort']) => void;
  readonly perPage: number;
  readonly onPerPage: (v: number) => void;
  readonly hasActiveFilters: boolean;
  readonly onClear: () => void;
}

const PER_PAGE_OPTIONS = [5, 10, 25];

export function SimuladosToolbar({
  search,
  onSearch,
  examOptions,
  exam,
  onExam,
  status,
  onStatus,
  sort,
  onSort,
  perPage,
  onPerPage,
  hasActiveFilters,
  onClear,
}: SimuladosToolbarProps) {
  const { t } = useTranslation();

  const examItems = ['all', ...examOptions];

  const statusItems: { key: SimuladosToolbarProps['status']; label: string }[] = [
    { key: 'all', label: t('simulado.table.filterAllStatus') },
    { key: 'pending', label: t('simulado.statusPending') },
    { key: 'in_progress', label: t('simulado.statusInProgress') },
    { key: 'answered', label: t('simulado.statusAnswered') },
  ];

  const sortItems: { key: SimuladosToolbarProps['sort']; label: string }[] = [
    { key: 'recent', label: t('simulado.table.sortRecent') },
    { key: 'oldest', label: t('simulado.table.sortOldest') },
    { key: 'bestScore', label: t('simulado.table.sortBestScore') },
    { key: 'name', label: t('simulado.table.sortName') },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          className="w-[260px]"
          placeholder={t('simulado.table.searchPlaceholder')}
          testId="simulado-search-input"
          value={search}
          onValueChange={onSearch}
        />

        <Select
          {...inputProperties.select}
          aria-label={t('simulado.table.filterAllExams')}
          className="w-[200px]"
          data-testid="simulado-exam-filter"
          disallowEmptySelection
          selectedKeys={new Set([exam])}
          onSelectionChange={(keys) => onExam(String(Array.from(keys)[0] ?? 'all'))}
        >
          {examItems.map((option) => (
            <SelectItem key={option}>{option === 'all' ? t('simulado.table.filterAllExams') : option}</SelectItem>
          ))}
        </Select>

        <Select
          {...inputProperties.select}
          aria-label={t('simulado.table.filterAllStatus')}
          className="w-[180px]"
          data-testid="simulado-status-filter"
          disallowEmptySelection
          selectedKeys={new Set([status])}
          onSelectionChange={(keys) => onStatus(Array.from(keys)[0] as SimuladosToolbarProps['status'])}
        >
          {statusItems.map((item) => (
            <SelectItem key={item.key}>{item.label}</SelectItem>
          ))}
        </Select>

        {hasActiveFilters && (
          <Button className={buttonStyles.flat} data-testid="simulado-clear-filters-btn" size="sm" onPress={onClear}>
            {t('common.clearFilters')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SortSelect
          className="w-[170px]"
          label={t('common.sortBy')}
          options={sortItems}
          testId="simulado-sort-select"
          value={sort}
          onChange={(value) => onSort(value as SimuladosToolbarProps['sort'])}
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-default-500">{t('simulado.table.perPage')}</span>
          <Select
            {...inputProperties.select}
            aria-label={t('simulado.table.perPage')}
            className="w-[90px]"
            data-testid="simulado-per-page-select"
            disallowEmptySelection
            selectedKeys={new Set([String(perPage)])}
            onSelectionChange={(keys) => onPerPage(Number(Array.from(keys)[0]))}
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <SelectItem key={String(option)}>{String(option)}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
