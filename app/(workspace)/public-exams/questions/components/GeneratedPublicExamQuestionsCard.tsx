import React, { useEffect } from 'react';
import { Checkbox } from '@heroui/checkbox';
import { Listbox, ListboxItem } from '@heroui/listbox';

import { AIPublicExamQuestion } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface GeneratedPublicExamQuestionsCardProps {
  readonly question: AIPublicExamQuestion;
  readonly index: number;
  readonly selectedIds: number[];
  readonly setSelectedIds: (ids: number[]) => void;
}

export function GeneratedPublicExamQuestionsCard({
  question,
  index,
  selectedIds,
  setSelectedIds,
}: GeneratedPublicExamQuestionsCardProps) {
  const [isSelected, setIsSelected] = React.useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsSelected(selectedIds.includes(question.id));
  }, [selectedIds, question.id]);

  const onCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    const selected = new Set(selectedIds);

    if (checked) selected.add(question.id);
    else selected.delete(question.id);
    setIsSelected(checked);
    setSelectedIds(Array.from(selected));
  };

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 pb-3">
        <div className="flex items-center justify-between w-full">
          <h4 className="font-semibold text-foreground text-sm leading-relaxed">
            <span className="inline-block mr-2 text-default-400">{index + 1}.</span>
            {question.text}
          </h4>
          <Checkbox className="ml-auto flex-shrink-0" isSelected={isSelected} onChange={onCheckboxChange} />
        </div>
      </div>
      <div>
        <p className="text-default-400 text-xs font-semibold mb-2">
          {t(question.correctCount === 1 ? 'generate.correctAnswer' : 'generate.correctAnswers', {
            count: question.correctCount,
          })}
        </p>
        <Listbox aria-label={t('aria.options')} classNames={{ base: 'p-0', list: 'gap-1' }}>
          {Object.entries(question.options).map(([key, val]) => (
            <ListboxItem
              key={key}
              classNames={{
                base: 'rounded-lg px-3 py-2 text-default-600 hover:text-foreground hover:bg-default-100 data-[hover=true]:bg-default-100 transition-colors',
                title: 'text-sm',
              }}
            >
              <strong className="mr-2 text-primary">{key}.</strong> {val}
            </ListboxItem>
          ))}
        </Listbox>
      </div>
    </div>
  );
}
