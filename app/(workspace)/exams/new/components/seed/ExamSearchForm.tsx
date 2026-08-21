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
        <label className="text-xs font-semibold text-default-500" htmlFor="exam-search-input">
          {t('exam.newSearchLabel')}
        </label>
      )}
      <form
        className={`flex gap-2.5 ${showLabel ? 'mt-2' : ''} ${compact ? 'flex-col' : ''}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!isBusy) onSubmit(query);
        }}
      >
        <Input
          {...inputProperties.input}
          className="grow"
          data-testid="exam-search-input"
          id="exam-search-input"
          isDisabled={isBusy}
          placeholder={t(type === 'certification' ? 'exam.aiSeedCertPlaceholder' : 'exam.aiSeedPublicExamPlaceholder')}
          value={query}
          onValueChange={setQuery}
        />
        <Button
          className={`${buttonStyles.primary} h-11 px-5 shrink-0`}
          data-testid="exam-search-submit-btn"
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
