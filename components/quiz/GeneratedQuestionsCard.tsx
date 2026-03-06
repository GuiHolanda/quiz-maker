import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { AIQuestion } from '@/types';
import { Checkbox } from '@heroui/checkbox';
import { Listbox, ListboxItem } from '@heroui/listbox';
import useQuizContext from '@/features/hooks/useQuizContext.hook';

interface QuestionCardProps {
  readonly question: AIQuestion;
  readonly index: number;
}

export function GeneratedQuestionsCard({ question, index }: QuestionCardProps) {
  const { state, setSelectedAIquestions } = useQuizContext();
  const [isSelected, setIsSelected] = React.useState(false);

  useEffect(() => {
    if (!state?.selectedAIQuestions) {
      setIsSelected(false);
      return;
    }
    setIsSelected(state.selectedAIQuestions.includes(question.id));
  }, [state?.selectedAIQuestions, index]);

  const onCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    if (!state?.selectedAIQuestions) return;
    const selected = new Set(state.selectedAIQuestions);
    if (checked) {
      selected.add(index);
      setIsSelected(true);
    } else {
      selected.delete(index);
      setIsSelected(false);
    }
    setSelectedAIquestions(Array.from(selected));
  };

  return (
    <Card className="p-4">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex items-center justify-between w-full">
          <h4 className="font-semibold text-foreground">
            <span>
              <span className="inline-block mr-2">{index + 1}.</span>
            </span>
            {question.text}
          </h4>
          <Checkbox isSelected={isSelected} onChange={onCheckboxChange} className='ml-auto'></Checkbox>
        </div>
      </CardHeader>
      <CardBody>
        <h4 className='text-neutral-500 text-sm font-bold'>{`${question.correctCount} correct answers`}</h4>
        <Listbox aria-label="Actions">
          {Object.entries(question.options).map(([key, val]) => (
            <ListboxItem key={key}><strong className='mr-2'>{key}.</strong> {val}</ListboxItem>
          ))}
        </Listbox>
      </CardBody>
    </Card>
  );
}
