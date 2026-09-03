'use client';

import type { ChangeEvent } from 'react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { FauxCheckbox } from '@/shared/components/ui/FauxCheckbox';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { SortSelect } from '@/shared/components/ui/SortSelect';
import type { QuestionBankSort } from '@/shared/types';

interface QuestionBankToolbarProps {
  readonly allOnPageSelected: boolean;
  readonly filteredTotal: number;
  readonly savedTotal: number;
  readonly sort: QuestionBankSort;
  readonly pageSize: number;
  readonly onToggleSelectPage: () => void;
  readonly onSortChange: (sort: QuestionBankSort) => void;
  readonly onPageSizeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const SORT_OPTIONS: { key: QuestionBankSort; labelKey: string }[] = [
  { key: 'desc', labelKey: 'questionBank.sortNewest' },
  { key: 'asc', labelKey: 'questionBank.sortOldest' },
  { key: 'errorRate', labelKey: 'questionBank.sortErrorRate' },
  { key: 'mostUsed', labelKey: 'questionBank.sortMostUsed' },
];

export function QuestionBankToolbar({
  allOnPageSelected,
  filteredTotal,
  savedTotal,
  sort,
  pageSize,
  onToggleSelectPage,
  onSortChange,
  onPageSizeChange,
}: QuestionBankToolbarProps) {
  const { t } = useTranslation();

  const countLabel =
    filteredTotal === savedTotal
      ? t('questionBank.countInBank', { count: savedTotal })
      : t('questionBank.countFiltered', { shown: filteredTotal, total: savedTotal });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2.5 rounded-lg border border-divider px-3 py-2 text-sm text-default-500 transition-colors duration-200 hover:bg-content2 hover:text-foreground"
          data-testid="question-bank-select-all"
          type="button"
          onClick={onToggleSelectPage}
        >
          <FauxCheckbox checked={allOnPageSelected} />
          {allOnPageSelected ? t('questionBank.deselectPage') : t('questionBank.selectPage')}
        </button>
        <span className="text-sm text-default-500">{countLabel}</span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <SortSelect
          className="w-52"
          label={t('common.sortBy')}
          options={SORT_OPTIONS.map((option) => ({ key: option.key, label: t(option.labelKey) }))}
          testId="question-bank-sort-select"
          value={sort}
          onChange={(value) => onSortChange(value as QuestionBankSort)}
        />
        <ItemsPerPageSelect value={pageSize} onChange={onPageSizeChange} />
      </div>
    </div>
  );
}
