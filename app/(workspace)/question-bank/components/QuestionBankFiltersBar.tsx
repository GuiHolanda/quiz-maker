'use client';

import { useEffect, useState } from 'react';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faSliders, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { getQuestionBankTopics, getQuestionBankSources } from '@/features/connectors';

export interface QuestionBankFilters {
  readonly search: string;
  readonly type: 'all' | 'certification' | 'public_exam';
  readonly source: string[];
  readonly topic: string[];
  readonly difficulty: string[];
  readonly hasAnswer: '' | 'true' | 'false';
  readonly hasExplanation: '' | 'true' | 'false';
}

export const EMPTY_FILTERS: QuestionBankFilters = {
  search: '',
  type: 'all',
  source: [],
  topic: [],
  difficulty: [],
  hasAnswer: '',
  hasExplanation: '',
};

export function hasActiveFilters(filters: QuestionBankFilters): boolean {
  return (
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.source.length > 0 ||
    filters.topic.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.hasAnswer !== '' ||
    filters.hasExplanation !== ''
  );
}

interface QuestionBankFiltersBarProps {
  readonly filters: QuestionBankFilters;
  readonly onFilterChange: <K extends keyof QuestionBankFilters>(key: K, value: QuestionBankFilters[K]) => void;
  readonly onClear: () => void;
}

export function QuestionBankFiltersBar({ filters, onFilterChange, onClear }: QuestionBankFiltersBarProps) {
  const { t } = useTranslation();
  const active = hasActiveFilters(filters);
  const [sources, setSources] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    const type = filters.type === 'all' ? undefined : filters.type;
    Promise.all([
      getQuestionBankSources(type).catch(() => [] as string[]),
      getQuestionBankTopics(type).catch(() => [] as string[]),
    ]).then(([s, tp]) => {
      setSources(s);
      setTopics(tp);
    });
  }, [filters.type]);

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

      {/* Row 1: Search + Source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          {...inputProperties.input}
          label={t('questionBank.labelSearch')}
          placeholder={t('questionBank.searchPlaceholder')}
          startContent={<FontAwesomeIcon className="w-3.5 h-3.5 text-default-400" icon={faMagnifyingGlass} />}
          value={filters.search}
          onValueChange={(v) => onFilterChange('search', v)}
        />
        <Select
          {...inputProperties.select}
          label={t('questionBank.labelSource')}
          placeholder={t('questionBank.filterSource')}
          selectionMode="multiple"
          selectedKeys={new Set(filters.source)}
          onSelectionChange={(keys) => onFilterChange('source', Array.from(keys) as string[])}
        >
          {sources.map((src) => (
            <SelectItem key={src}>{src}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Row 2: Type + Topic + Difficulty + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          {...inputProperties.select}
          label={t('questionBank.labelType')}
          placeholder={t('questionBank.filterType')}
          selectedKeys={filters.type !== 'all' ? new Set([filters.type]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as QuestionBankFilters['type'] | undefined;
            onFilterChange('type', val ?? 'all');
            onFilterChange('source', []);
            onFilterChange('topic', []);
          }}
        >
          <SelectItem key="certification">{t('questionBank.typeCertification')}</SelectItem>
          <SelectItem key="public_exam">{t('questionBank.typePublicExam')}</SelectItem>
        </Select>

        <Select
          {...inputProperties.select}
          label={t('questionBank.labelTopic')}
          placeholder={t('questionBank.filterTopic')}
          selectionMode="multiple"
          selectedKeys={new Set(filters.topic)}
          onSelectionChange={(keys) => onFilterChange('topic', Array.from(keys) as string[])}
        >
          {topics.map((topic) => (
            <SelectItem key={topic}>{topic}</SelectItem>
          ))}
        </Select>

        <Select
          {...inputProperties.select}
          label={t('questionBank.labelDifficulty')}
          placeholder={t('questionBank.filterDifficulty')}
          selectionMode="multiple"
          selectedKeys={new Set(filters.difficulty)}
          onSelectionChange={(keys) => onFilterChange('difficulty', Array.from(keys) as string[])}
        >
          <SelectItem key="easy">{t('questionBank.difficultyEasy')}</SelectItem>
          <SelectItem key="medium">{t('questionBank.difficultyMedium')}</SelectItem>
          <SelectItem key="hard">{t('questionBank.difficultyHard')}</SelectItem>
        </Select>

        <Select
          {...inputProperties.select}
          label={t('questionBank.labelStatus')}
          placeholder={t('questionBank.filterStatus')}
          selectedKeys={
            filters.hasAnswer !== ''
              ? new Set([`answer_${filters.hasAnswer}`])
              : filters.hasExplanation !== ''
                ? new Set([`explanation_${filters.hasExplanation}`])
                : new Set([])
          }
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string | undefined;
            if (!val) {
              onFilterChange('hasAnswer', '');
              onFilterChange('hasExplanation', '');
            } else if (val.startsWith('answer_')) {
              onFilterChange('hasAnswer', val.replace('answer_', '') as '' | 'true' | 'false');
              onFilterChange('hasExplanation', '');
            } else if (val.startsWith('explanation_')) {
              onFilterChange('hasExplanation', val.replace('explanation_', '') as '' | 'true' | 'false');
              onFilterChange('hasAnswer', '');
            }
          }}
        >
          <SelectItem key="answer_true">{t('questionBank.statusHasAnswer')}</SelectItem>
          <SelectItem key="answer_false">{t('questionBank.statusNoAnswer')}</SelectItem>
          <SelectItem key="explanation_true">{t('questionBank.statusHasExplanation')}</SelectItem>
          <SelectItem key="explanation_false">{t('questionBank.statusNoExplanation')}</SelectItem>
        </Select>
      </div>
    </div>
  );
}
