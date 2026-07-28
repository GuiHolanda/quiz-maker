'use client';

import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { GenerationHistoryFilters, GenerationHistoryFilterOptions } from '@/shared/types';

export function hasActiveHistoryFilters(filters: GenerationHistoryFilters): boolean {
  return filters.domain !== 'all' || filters.source.length > 0 || filters.topic.length > 0 || filters.status.length > 0;
}

interface GenerationHistoryFiltersBarProps {
  readonly filters: GenerationHistoryFilters;
  readonly filterOptions: GenerationHistoryFilterOptions;
  readonly onFilterChange: <K extends keyof GenerationHistoryFilters>(
    key: K,
    value: GenerationHistoryFilters[K]
  ) => void;
  readonly onClear: () => void;
}

export function GenerationHistoryFiltersBar({
  filters,
  filterOptions,
  onFilterChange,
  onClear,
}: GenerationHistoryFiltersBarProps) {
  const { t } = useTranslation();
  const active = hasActiveHistoryFilters(filters);

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <FontAwesomeIcon className="w-3.5 h-3.5 text-default-400 shrink-0" icon={faSliders} />
        <span className="text-xs font-semibold text-default-500">{t('generate.historyFilters')}</span>
        {active && (
          <Button
            className={`${buttonStyles.flat} ml-auto h-7 px-3 text-xs`}
            size="sm"
            startContent={<FontAwesomeIcon className="w-3 h-3" icon={faXmark} />}
            onPress={onClear}
          >
            {t('generate.historyClearFilters')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          {...inputProperties.select}
          label={t('generate.historyFilterDomain')}
          placeholder={t('generate.historyFilterDomain')}
          selectedKeys={filters.domain !== 'all' ? new Set([filters.domain]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as GenerationHistoryFilters['domain'] | undefined;
            onFilterChange('domain', val ?? 'all');
            onFilterChange('source', []);
            onFilterChange('topic', []);
          }}
        >
          <SelectItem key="certification">{t('questionBank.typeCertification')}</SelectItem>
          <SelectItem key="public_exam">{t('questionBank.typePublicExam')}</SelectItem>
        </Select>

        <Select
          {...inputProperties.select}
          label={t('generate.historyFilterSource')}
          placeholder={t('generate.historyFilterSource')}
          selectionMode="multiple"
          selectedKeys={new Set(filters.source)}
          onSelectionChange={(keys) => onFilterChange('source', Array.from(keys) as string[])}
        >
          {filterOptions.sources.map((src) => (
            <SelectItem key={src}>{src}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          {...inputProperties.select}
          label={t('generate.historyFilterTopic')}
          placeholder={t('generate.historyFilterTopic')}
          selectionMode="multiple"
          selectedKeys={new Set(filters.topic)}
          onSelectionChange={(keys) => onFilterChange('topic', Array.from(keys) as string[])}
        >
          {filterOptions.topics.map((topic) => (
            <SelectItem key={topic}>{topic}</SelectItem>
          ))}
        </Select>

        <Select
          {...inputProperties.select}
          label={t('generate.historyFilterStatus')}
          placeholder={t('generate.historyFilterStatus')}
          selectionMode="multiple"
          selectedKeys={new Set(filters.status)}
          onSelectionChange={(keys) => onFilterChange('status', Array.from(keys) as string[])}
        >
          <SelectItem key="done">{t('generate.statusDone')}</SelectItem>
          <SelectItem key="awaiting_review">{t('generate.statusAwaitingReview')}</SelectItem>
          <SelectItem key="error">{t('generate.statusError')}</SelectItem>
          <SelectItem key="cancelled">{t('generate.statusCancelled')}</SelectItem>
          <SelectItem key="running">{t('generate.statusRunning')}</SelectItem>
        </Select>
      </div>
    </div>
  );
}
