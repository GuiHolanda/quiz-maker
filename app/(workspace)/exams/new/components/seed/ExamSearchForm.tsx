'use client';

import type { ExamIdentifyHints, ExamType } from '@/shared/types';

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
import { ExamDetailsDisclosure } from './ExamDetailsDisclosure';

interface ExamSearchFormProps {
  readonly type: ExamType;
  readonly isBusy: boolean;
  readonly isSearching: boolean;
  readonly initialQuery?: string;
  readonly showLabel?: boolean;
  readonly compact?: boolean;
  readonly withDetails?: boolean;
  readonly onSubmit: (query: string, hints?: ExamIdentifyHints) => void;
}

export function ExamSearchForm({
  type,
  isBusy,
  isSearching,
  initialQuery = '',
  showLabel = true,
  compact = false,
  withDetails = true,
  onSubmit,
}: ExamSearchFormProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const [hints, setHints] = useState<ExamIdentifyHints>({});

  return (
    <div>
      {showLabel && (
        <label className="text-xs font-semibold text-default-500" htmlFor="exam-search-input">
          {t('exam.newSearchLabel')}
        </label>
      )}
      <form
        className={showLabel ? 'mt-2' : ''}
        onSubmit={(e) => {
          e.preventDefault();
          if (!isBusy) onSubmit(query, withDetails ? hints : undefined);
        }}
      >
        <div className={`flex gap-2.5 ${compact ? 'flex-col' : ''}`}>
          <Input
            {...inputProperties.input}
            className="grow"
            data-testid="exam-search-input"
            id="exam-search-input"
            isDisabled={isBusy}
            placeholder={t(
              type === 'certification' ? 'exam.aiSeedCertPlaceholder' : 'exam.aiSeedPublicExamPlaceholder'
            )}
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
        </div>
        {withDetails && <ExamDetailsDisclosure isDisabled={isBusy} type={type} value={hints} onChange={setHints} />}
      </form>
    </div>
  );
}
