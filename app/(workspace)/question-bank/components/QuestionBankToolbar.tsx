'use client';

import type { ChangeEvent } from 'react';
import { Select, SelectItem } from '@heroui/select';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { FauxCheckbox } from '@/shared/components/ui/FauxCheckbox';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
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
        <div className="flex items-end gap-2">
          <label className="pb-0.5 text-xs font-semibold text-default-500" htmlFor="questionBankSort">
            {t('questionBank.sortLabel')}
          </label>
          <Select
            aria-label={t('questionBank.sortLabel')}
            className="w-52"
            data-testid="question-bank-sort-select"
            id="questionBankSort"
            selectedKeys={new Set([sort])}
            {...inputProperties.select}
            size="sm"
            classNames={{
              ...inputProperties.select.classNames,
              trigger: inputProperties.select.classNames.trigger.replace('h-11', '').trim(),
            }}
            onSelectionChange={(keys) => onSortChange(Array.from(keys)[0] as QuestionBankSort)}
          >
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{t(option.labelKey)}</SelectItem>
            ))}
          </Select>
        </div>
        <ItemsPerPageSelect value={pageSize} onChange={onPageSizeChange} />
      </div>
    </div>
  );
}
