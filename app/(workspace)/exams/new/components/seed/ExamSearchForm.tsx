'use client';

import type { ExamType } from '@/shared/types';

import { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface ExamSearchFormProps {
  readonly type: ExamType;
  readonly isBusy: boolean;
  readonly isSearching: boolean;
  readonly initialQuery?: string;
  readonly showLabel?: boolean;
  readonly compact?: boolean;
  readonly onSubmit: (query: string) => void;
}

// Used twice: as the picker's primary search, and inside the loading screen's identification
// card when a search comes back without a usable match. Same control in both places so
// retrying never looks like a different feature.
export function ExamSearchForm({
  type,
  isBusy,
  isSearching,
  initialQuery = '',
  showLabel = true,
  compact = false,
  onSubmit,
}: ExamSearchFormProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);

  return (
    <div>
      {showLabel && (
        <label className="font-mono text-[11px] uppercase tracking-widest text-default-400" htmlFor="exam-search-input">
          {t('exam.newSearchLabel')}
        </label>
      )}
      <form
        className={`flex gap-2.5 ${showLabel ? 'mt-2.5' : ''} ${compact ? 'flex-col sm:flex-row' : ''}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!isBusy) onSubmit(query);
        }}
      >
        <Input
          {...inputProperties.input}
          className="grow"
          id="exam-search-input"
          isDisabled={isBusy}
          placeholder={t(type === 'certification' ? 'exam.aiSeedCertPlaceholder' : 'exam.aiSeedPublicExamPlaceholder')}
          value={query}
          onValueChange={setQuery}
        />
        <Button
          className={`${buttonStyles.primary} h-11 px-5 shrink-0`}
          isDisabled={isBusy || !query.trim()}
          startContent={
            isSearching ? <Spinner color="current" size="sm" /> : <FontAwesomeIcon icon={faMagnifyingGlass} />
          }
          type="submit"
        >
          {t(EXAM_CONFIG[type].seedSearchActionKey)}
        </Button>
      </form>
    </div>
  );
}
