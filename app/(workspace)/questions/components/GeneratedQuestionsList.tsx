'use client';

import React from 'react';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';

import { GeneratedQuestionCard } from './GeneratedQuestionCard';

import { AIQuestion, AIPublicExamQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface GeneratedQuestionsListProps {
  readonly questions: AIQuestion[] | AIPublicExamQuestion[];
  readonly selectedIds: number[];
  readonly setSelectedIds: (ids: number[]) => void;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
  readonly isSaving: boolean;
  readonly isLoadingMore?: boolean;
  readonly remainingCount?: number;
}

export function GeneratedQuestionsList({
  questions,
  selectedIds,
  setSelectedIds,
  onSave,
  onDiscard,
  isSaving,
  isLoadingMore = false,
  remainingCount = 0,
}: GeneratedQuestionsListProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [questionsPerPage, setQuestionsPerPage] = React.useState<number>(5);
  const { t } = useTranslation();

  const selectedCount = selectedIds.length;
  const selectedCountLabel = String(selectedCount).padStart(2, '0');
  const allSelected = questions.length > 0 && selectedCount === questions.length;

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, endIndex);

  const onToggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? questions.map((q) => q.id) : []);
  };

  const onItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = Number(e.target.value) || 1;
    const bounded = Math.max(1, Math.min(questions.length, v));
    setQuestionsPerPage(bounded);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 font-bold text-sm">
          {!isLoadingMore && (
            <>
              <Checkbox
                classNames={{ label: 'text-xs' }}
                isSelected={allSelected}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
              >
                {t('common.selectAll')}
              </Checkbox>
              {selectedCount > 0 && (
                <Chip color="primary" size="sm" variant="flat">
                  <strong>{t('common.selectedQuestions', { count: selectedCountLabel })}</strong>
                </Chip>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {!isLoadingMore && (
            <Button className={buttonStyles.dangerFlat} size="sm" onPress={onDiscard}>
              {selectedCount > 0 ? t('common.discardSelected') : t('common.discardAll')}
            </Button>
          )}
          {selectedCount > 0 && !isLoadingMore && (
            <Button className={buttonStyles.primary} size="sm" onPress={onSave}>
              {t('common.saveSelected')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {visibleQuestions.length > 0 &&
          visibleQuestions.map((question, idx) => {
            const globalIndex = startIndex + idx;

            return (
              <GeneratedQuestionCard
                key={question.id}
                index={globalIndex}
                question={question}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
              />
            );
          })}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        <ItemsPerPageSelect isDisabled={isLoadingMore} value={questionsPerPage} onChange={onItemsPerPageChange} />

        {isLoadingMore && remainingCount > 0 && (
          <InlineAlert
            className="w-full mt-2"
            color="primary"
            variant="bordered"
            startContent={<Spinner color="primary" size="sm" />}
            title={t('generate.loadingMoreQuestions', { count: remainingCount })}
            description={t('generate.loadingMoreQuestionsHint')}
          />
        )}
      </div>
      <BusyDialog isOpen={isSaving} />
    </div>
  );
}
