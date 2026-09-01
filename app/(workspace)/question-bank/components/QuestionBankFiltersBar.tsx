'use client';

import { useEffect, useState } from 'react';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { getQuestionBankSources, getQuestionBankTopics } from '@/features/connectors';
import type { QuestionBankSummary, QuestionSituation } from '@/shared/types';

export interface QuestionBankFilters {
  readonly search: string;
  readonly certification: string;
  readonly topic: string;
  readonly difficulty: string;
  readonly explanation: '' | 'with' | 'without';
  readonly situation: '' | QuestionSituation;
}

export const EMPTY_FILTERS: QuestionBankFilters = {
  search: '',
  certification: '',
  topic: '',
  difficulty: '',
  explanation: '',
  situation: '',
};

export function hasActiveFilters(filters: QuestionBankFilters): boolean {
  return (
    filters.search !== '' ||
    filters.certification !== '' ||
    filters.topic !== '' ||
    filters.difficulty !== '' ||
    filters.explanation !== '' ||
    filters.situation !== ''
  );
}

interface QuestionBankFiltersBarProps {
  readonly filters: QuestionBankFilters;
  readonly summary: QuestionBankSummary | null;
  readonly onFilterChange: <K extends keyof QuestionBankFilters>(key: K, value: QuestionBankFilters[K]) => void;
  readonly onClear: () => void;
}

const SITUATION_CHIPS: { key: '' | QuestionSituation; labelKey: string }[] = [
  { key: '', labelKey: 'questionBank.situationAll' },
  { key: 'correct', labelKey: 'questionBank.situationCorrect' },
  { key: 'wrong', labelKey: 'questionBank.situationWrong' },
  { key: 'unanswered', labelKey: 'questionBank.situationUnanswered' },
];

export function QuestionBankFiltersBar({ filters, summary, onFilterChange, onClear }: QuestionBankFiltersBarProps) {
  const { t } = useTranslation();
  const [sources, setSources] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getQuestionBankSources().catch(() => [] as string[]),
      getQuestionBankTopics().catch(() => [] as string[]),
    ]).then(([nextSources, nextTopics]) => {
      setSources(nextSources);
      setTopics(nextTopics);
    });
  }, []);

  const situationCount = (key: '' | QuestionSituation): number => {
    if (!summary) return 0;
    if (key === '') return summary.saved;
    if (key === 'correct') return summary.bySituation.correct;
    if (key === 'wrong') return summary.bySituation.wrong;
    return summary.bySituation.unanswered;
  };

  return (
    <div className="bg-content1 rounded-xl p-6 flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(0,1fr))]">
        <Input
          {...inputProperties.input}
          aria-label={t('questionBank.labelSearch')}
          data-testid="question-bank-search"
          placeholder={t('questionBank.searchPlaceholder')}
          startContent={<FontAwesomeIcon className="w-3.5 h-3.5 text-default-400" icon={faMagnifyingGlass} />}
          value={filters.search}
          onValueChange={(value) => onFilterChange('search', value)}
        />

        <Select
          {...inputProperties.select}
          aria-label={t('questionBank.labelSource')}
          data-testid="question-bank-source-filter"
          selectedKeys={new Set([filters.certification || 'all'])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            onFilterChange('certification', value === 'all' ? '' : value);
          }}
        >
          {[
            <SelectItem key="all">{t('questionBank.allCertifications')}</SelectItem>,
            ...sources.map((source) => <SelectItem key={source}>{source}</SelectItem>),
          ]}
        </Select>

        <Select
          {...inputProperties.select}
          aria-label={t('questionBank.labelTopic')}
          selectedKeys={new Set([filters.topic || 'all'])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            onFilterChange('topic', value === 'all' ? '' : value);
          }}
        >
          {[
            <SelectItem key="all">{t('questionBank.allTopics')}</SelectItem>,
            ...topics.map((topic) => <SelectItem key={topic}>{topic}</SelectItem>),
          ]}
        </Select>

        <Select
          {...inputProperties.select}
          aria-label={t('questionBank.labelDifficulty')}
          data-testid="question-bank-difficulty-filter"
          selectedKeys={new Set([filters.difficulty || 'all'])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            onFilterChange('difficulty', value === 'all' ? '' : value);
          }}
        >
          <SelectItem key="all">{t('questionBank.allDifficulties')}</SelectItem>
          <SelectItem key="easy">{t('questionBank.difficultyEasy')}</SelectItem>
          <SelectItem key="medium">{t('questionBank.difficultyMedium')}</SelectItem>
          <SelectItem key="hard">{t('questionBank.difficultyHard')}</SelectItem>
        </Select>

        <Select
          {...inputProperties.select}
          aria-label={t('questionBank.filterExplanation')}
          selectedKeys={new Set([filters.explanation || 'all'])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            onFilterChange('explanation', value === 'all' ? '' : (value as QuestionBankFilters['explanation']));
          }}
        >
          <SelectItem key="all">{t('questionBank.explanationAll')}</SelectItem>
          <SelectItem key="with">{t('questionBank.explanationWith')}</SelectItem>
          <SelectItem key="without">{t('questionBank.explanationWithout')}</SelectItem>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-default-400 mr-1">{t('questionBank.situationLabel')}</span>
        {SITUATION_CHIPS.map((chip) => {
          const isActive = filters.situation === chip.key;

          return (
            <button
              key={chip.key || 'all'}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-divider bg-content1 text-default-500 hover:border-primary/50'
              }`}
              type="button"
              onClick={() => onFilterChange('situation', chip.key)}
            >
              {t(chip.labelKey)}
              <span className="font-mono text-xs opacity-75">{situationCount(chip.key)}</span>
            </button>
          );
        })}
        <button
          className="ml-auto flex items-center gap-2 rounded-lg border border-divider px-3 py-1.5 text-sm text-default-500 transition-colors duration-200 hover:bg-content2 hover:text-foreground"
          type="button"
          onClick={onClear}
        >
          <FontAwesomeIcon className="w-3.5 h-3.5" icon={faRotateLeft} />
          {t('questionBank.clearFilters')}
        </button>
      </div>
    </div>
  );
}
