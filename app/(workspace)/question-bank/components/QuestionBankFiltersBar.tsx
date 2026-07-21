'use client';

import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faSliders, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

export interface QuestionBankFilters {
  readonly search: string;
  readonly type: 'all' | 'certification' | 'public_exam';
  readonly topic: string;
  readonly difficulty: string;
  readonly hasAnswer: '' | 'true' | 'false';
  readonly hasExplanation: '' | 'true' | 'false';
}

export const EMPTY_FILTERS: QuestionBankFilters = {
  search: '',
  type: 'all',
  topic: '',
  difficulty: '',
  hasAnswer: '',
  hasExplanation: '',
};

interface QuestionBankFiltersBarProps {
  readonly filters: QuestionBankFilters;
  readonly onFilterChange: <K extends keyof QuestionBankFilters>(key: K, value: QuestionBankFilters[K]) => void;
  readonly onClear: () => void;
}

function hasActiveFilters(filters: QuestionBankFilters): boolean {
  return (
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.topic !== '' ||
    filters.difficulty !== '' ||
    filters.hasAnswer !== '' ||
    filters.hasExplanation !== ''
  );
}

export function QuestionBankFiltersBar({ filters, onFilterChange, onClear }: QuestionBankFiltersBarProps) {
  const { t } = useTranslation();
  const active = hasActiveFilters(filters);

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <FontAwesomeIcon className="w-3.5 h-3.5 text-default-400 shrink-0" icon={faSliders} />
        <span className="text-xs font-semibold text-default-500">{t('questionBank.filters')}</span>
        {active && (
          <Button
            className={`${buttonStyles.flat} ml-auto h-7 px-3 text-xs`}
            size="sm"
            startContent={<FontAwesomeIcon className="w-3 h-3" icon={faXmark} />}
            onPress={onClear}
          >
            {t('questionBank.clearFilters')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Search */}
        <div className="xl:col-span-2">
          <Input
            {...inputProperties.input}
            aria-label={t('questionBank.searchPlaceholder')}
            placeholder={t('questionBank.searchPlaceholder')}
            startContent={<FontAwesomeIcon className="w-3.5 h-3.5 text-default-400" icon={faMagnifyingGlass} />}
            value={filters.search}
            onValueChange={(v) => onFilterChange('search', v)}
          />
        </div>

        {/* Type */}
        <Select
          {...inputProperties.select}
          aria-label={t('questionBank.filterType')}
          placeholder={t('questionBank.filterType')}
          selectedKeys={filters.type !== 'all' ? new Set([filters.type]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as QuestionBankFilters['type'] | undefined;
            onFilterChange('type', val ?? 'all');
          }}
        >
          <SelectItem key="certification">{t('questionBank.typeCertification')}</SelectItem>
          <SelectItem key="public_exam">{t('questionBank.typePublicExam')}</SelectItem>
        </Select>

        {/* Topic / subject */}
        <Input
          {...inputProperties.input}
          aria-label={t('questionBank.filterTopic')}
          placeholder={t('questionBank.filterTopic')}
          value={filters.topic}
          onValueChange={(v) => onFilterChange('topic', v)}
        />

        {/* Difficulty */}
        <Select
          {...inputProperties.select}
          aria-label={t('questionBank.filterDifficulty')}
          placeholder={t('questionBank.filterDifficulty')}
          selectedKeys={filters.difficulty ? new Set([filters.difficulty]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string | undefined;
            onFilterChange('difficulty', val ?? '');
          }}
        >
          <SelectItem key="easy">{t('questionBank.difficultyEasy')}</SelectItem>
          <SelectItem key="medium">{t('questionBank.difficultyMedium')}</SelectItem>
          <SelectItem key="hard">{t('questionBank.difficultyHard')}</SelectItem>
        </Select>

        {/* Status */}
        <Select
          {...inputProperties.select}
          aria-label={t('questionBank.filterStatus')}
          placeholder={t('questionBank.filterStatus')}
          selectedKeys={filters.hasAnswer !== '' ? new Set([filters.hasAnswer]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as QuestionBankFilters['hasAnswer'] | undefined;
            onFilterChange('hasAnswer', val ?? '');
          }}
        >
          <SelectItem key="true">{t('questionBank.statusHasAnswer')}</SelectItem>
          <SelectItem key="false">{t('questionBank.statusNoAnswer')}</SelectItem>
        </Select>
      </div>
    </div>
  );
}
