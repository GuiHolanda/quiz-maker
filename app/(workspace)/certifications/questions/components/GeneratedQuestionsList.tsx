import React from 'react';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';

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
}: Readonly<{
  questions: AIQuestion[];
  onSaved?: () => void;
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
      <div className="flex items-end justify-between">
        <div className="flex items-center space-x-4 font-bold text-sm">
          <Checkbox className="ml-auto"  isSelected={allSelected} onChange={(e) => onToggleSelectAll(e.target.checked)} classNames={{ label: 'text-xs' }}>
            {t('common.selectAll')}
          </Checkbox>
          {selectedCount > 0 && (
            <Chip size="sm" variant="flat" color="primary">
              <strong>{t('common.selectedQuestions', { count: selectedCountLabel })}</strong>
            </Chip>
          )}
        </div>
        <ItemsPerPageSelect value={questionsPerPage} onChange={onItemsPerPageChange} />
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

      <div className="flex gap-2">
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

        <Button className={`${buttonStyles.dangerFlat} ml-auto`} size="sm" onPress={onDiscardQuestions}>
          {selectedCount > 0 ? t('common.discardSelected') : t('common.discardAll')}
        </Button>

        <Button className={buttonStyles.primarySm} hidden={selectedCount === 0} size="sm" onPress={onSaveSelectedQuestions}>
          {t('common.saveSelected')}
        </Button>
      </div>

      <BusyDialog isOpen={loading} />
    </div>
  );
}
