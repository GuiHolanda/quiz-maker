'use client';

import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';

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
        <Input
          {...inputProperties.input}
          aria-label={t('simulado.table.searchPlaceholder')}
          className="w-[260px]"
          data-testid="simulado-search-input"
          placeholder={t('simulado.table.searchPlaceholder')}
          startContent={<FontAwesomeIcon className="h-3.5 w-3.5 text-default-400" icon={faMagnifyingGlass} />}
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
            {t('simulado.table.clearFilters')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-default-500">{t('simulado.table.sortLabel')}</span>
          <Select
            {...inputProperties.select}
            aria-label={t('simulado.table.sortLabel')}
            className="w-[170px]"
            data-testid="simulado-sort-select"
            disallowEmptySelection
            selectedKeys={new Set([sort])}
            onSelectionChange={(keys) => onSort(Array.from(keys)[0] as SimuladosToolbarProps['sort'])}
          >
            {sortItems.map((item) => (
              <SelectItem key={item.key}>{item.label}</SelectItem>
            ))}
          </Select>
        </div>

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
