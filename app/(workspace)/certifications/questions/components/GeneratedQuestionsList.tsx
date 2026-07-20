import React from 'react';
import { Alert } from '@heroui/alert';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';

import { GeneratedQuestionsCard } from './GeneratedQuestionsCard';

import { AIQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { saveQuestions } from '@/features/connectors';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

export function GeneratedQuestionsList({
  questions,
  onSaved,
  isLoadingMore = false,
  remainingCount = 0,
}: Readonly<{
  questions: AIQuestion[];
  onSaved?: () => void;
  isLoadingMore?: boolean;
  remainingCount?: number;
}>) {
  const { state, setSelectedAIquestions, setAIquestions } = useQuizContext();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [questionsPerPage, setQuestionsPerPage] = React.useState<number>(5);
  const { loading, request } = useRequest(saveQuestions);
  const { t } = useTranslation();

  const selectedCount = state?.selectedAIQuestions?.length ?? 0;
  const selectedCountLabel = String(selectedCount).padStart(2, '0');
  const allSelected = questions.length > 0 && selectedCount === questions.length;

  const onToggleSelectAll = (checked: boolean) => {
    setSelectedAIquestions(checked ? questions.map((question) => question.id) : []);
  };

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, endIndex);

  const onItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = Number(e.target.value) || 1;
    const bounded = Math.max(1, Math.min(questions.length, v));

    setQuestionsPerPage(bounded);
    setCurrentPage(1);
  };

  const onSaveSelectedQuestions = async () => {
    const requestPayload = {
      questions: state?.selectedAIQuestions?.map((id) => questions.find((q) => q.id === id)).filter(Boolean),
    };

    await request(requestPayload, onSaveSelectedQuestionsSuccess);
  };

  const onSaveSelectedQuestionsSuccess = () => {
    setSelectedAIquestions([]);
    setAIquestions([], null);
    onSaved?.();
  };

  const onDiscardQuestions = () => {
    if (selectedCount > 0) {
      const remaining = questions.filter((q) => !state?.selectedAIQuestions?.includes(q.id));

      setSelectedAIquestions([]);
      setAIquestions(remaining, null);
    } else {
      setSelectedAIquestions([]);
      setAIquestions([], null);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 font-bold text-sm">
          {!isLoadingMore && (
            <>
              <Checkbox
                isSelected={allSelected}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                classNames={{ label: 'text-xs' }}
              >
                {t('common.selectAll')}
              </Checkbox>
              {selectedCount > 0 && (
                <Chip size="sm" variant="flat" color="primary">
                  <strong>{t('common.selectedQuestions', { count: selectedCountLabel })}</strong>
                </Chip>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <ItemsPerPageSelect value={questionsPerPage} onChange={onItemsPerPageChange} isDisabled={isLoadingMore} />
          {!isLoadingMore && (
            <Button className={buttonStyles.dangerFlat} size="sm" onPress={onDiscardQuestions}>
              {selectedCount > 0 ? t('common.discardSelected') : t('common.discardAll')}
            </Button>
          )}
          {selectedCount > 0 && !isLoadingMore && (
            <Button className={buttonStyles.primarySm} size="sm" onPress={onSaveSelectedQuestions}>
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
              <GeneratedQuestionsCard
                key={`${question.topic}-${globalIndex}`}
                index={globalIndex}
                question={question}
              />
            );
          })}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

        {isLoadingMore && remainingCount > 0 && (
          <Alert
            color="default"
            variant="flat"
            title={t('generate.loadingMoreQuestions', { count: remainingCount })}
            description={t('generate.loadingMoreQuestionsHint')}
            endContent={<Spinner size="sm" />}
            classNames={{ base: 'w-full mt-2', title: 'text-xs font-semibold', description: 'text-xs font-semibold' }}
          />
        )}
      </div>

      <BusyDialog isOpen={loading} />
    </div>
  );
}
