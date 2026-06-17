import React from 'react';
import { AIPublicExamQuestion } from '@/shared/types';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { addToast } from '@heroui/toast';
import { GeneratedPublicExamQuestionsCard } from './GeneratedPublicExamQuestionsCard';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { savePublicExamQuestions } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface GeneratedPublicExamQuestionsListProps {
  readonly questions: AIPublicExamQuestion[];
  readonly setQuestions: React.Dispatch<React.SetStateAction<AIPublicExamQuestion[]>>;
}

export function GeneratedPublicExamQuestionsList({ questions, setQuestions }: GeneratedPublicExamQuestionsListProps) {
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
      addToast({
        title: t('toast.success'),
        description: t('toast.publicExamQuestionsSaved', { count: payload.length }),
        color: 'success',
      });
      setSelectedIds([]);
      setQuestions([]);
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
        <div className="flex items-center space-x-4 font-bold text-sm">
          <Checkbox isSelected={allSelected} onChange={(e) => onToggleSelectAll(e.target.checked)} className="ml-auto">
            {t('common.selectAll')}
          </Checkbox>
          {selectedCount > 0 && (
            <Chip color="primary">
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
              <GeneratedPublicExamQuestionsCard
                key={`${question.subject}-${globalIndex}`}
                question={question}
                index={globalIndex}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
              />
            );
          })}
      </div>

      <div className="flex gap-2">
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        <Button className="ml-auto" variant="flat" color="danger" size="sm" onPress={onDiscard}>
          {selectedCount > 0 ? t('common.discardSelected') : t('common.discardAll')}
        </Button>
        <Button
          variant="flat"
          color="primary"
          size="sm"
          onPress={onSaveSelected}
          hidden={selectedCount === 0}
        >
          {t('common.saveSelected')}
        </Button>
      </div>

      <BusyDialog isOpen={loading} />
    </div>
  );
}
