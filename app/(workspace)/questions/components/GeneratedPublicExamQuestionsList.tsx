import React from 'react';
import { Alert } from '@heroui/alert';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';

import { GeneratedQuestionCard } from './GeneratedQuestionCard';

import { AIPublicExamQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { savePublicExamQuestions } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface GeneratedPublicExamQuestionsListProps {
  readonly questions: AIPublicExamQuestion[];
  readonly setQuestions: React.Dispatch<React.SetStateAction<AIPublicExamQuestion[]>>;
  readonly onSaved?: () => void;
  readonly isLoadingMore?: boolean;
  readonly remainingCount?: number;
}

export function GeneratedPublicExamQuestionsList({
  questions,
  setQuestions,
  onSaved,
  isLoadingMore = false,
  remainingCount = 0,
}: GeneratedPublicExamQuestionsListProps) {
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [questionsPerPage, setQuestionsPerPage] = React.useState<number>(5);
  const { loading, request } = useRequest(savePublicExamQuestions);
  const { t } = useTranslation();

  const selectedCount = selectedIds.length;
  const selectedCountLabel = String(selectedCount).padStart(2, '0');
  const allSelected = questions.length > 0 && selectedCount === questions.length;

  const onToggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? questions.map((q) => q.id) : []);
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

  const onSaveSelected = async () => {
    const payload = selectedIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as AIPublicExamQuestion[];

    await request(payload, () => {
      notify.success(t('toast.success'), t('toast.publicExamQuestionsSaved', { count: payload.length }));
      setSelectedIds([]);
      setQuestions([]);
      onSaved?.();
    });
  };

  const onDiscard = () => {
    if (selectedCount > 0) {
      const remaining = questions.filter((q) => !selectedIds.includes(q.id));

      setSelectedIds([]);
      setQuestions(remaining);
    } else {
      setSelectedIds([]);
      setQuestions([]);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-end justify-between">
        <div className="flex items-center font-bold text-sm">
          {!isLoadingMore && (
            <>
              <Checkbox
                className="ml-auto mr-4"
                classNames={{ label: 'text-sm' }}
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
        <ItemsPerPageSelect isDisabled={isLoadingMore} value={questionsPerPage} onChange={onItemsPerPageChange} />
      </div>

      <div className="flex flex-col gap-3">
        {visibleQuestions.length > 0 &&
          visibleQuestions.map((question, idx) => {
            const globalIndex = startIndex + idx;

            return (
              <GeneratedQuestionCard
                key={`${question.subject}-${globalIndex}`}
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
        {isLoadingMore && remainingCount > 0 && (
          <Alert
            color="warning"
            variant="flat"
            title={t('generate.loadingMoreQuestions', { count: remainingCount })}
            description={t('generate.loadingMoreQuestionsHint')}
            endContent={<Spinner size="sm" />}
            classNames={{ base: 'w-full mt-2', title: 'text-xs font-semibold', description: 'text-xs font-semibold' }}
          />
        )}
        <Button className={`${buttonStyles.dangerFlat} ml-auto`} size="sm" onPress={onDiscard} hidden={isLoadingMore}>
          {selectedCount > 0 ? t('common.discardSelected') : t('common.discardAll')}
        </Button>
        <Button
          className={buttonStyles.primarySm}
          hidden={selectedCount === 0 || isLoadingMore}
          size="sm"
          onPress={onSaveSelected}
        >
          {t('common.saveSelected')}
        </Button>
      </div>

      <BusyDialog isOpen={loading} />
    </div>
  );
}
