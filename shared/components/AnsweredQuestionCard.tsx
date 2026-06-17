'use client';

import { Alert } from '@heroui/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

import { QuestionCardQuestion } from './QuestionCard';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Answer } from '@/shared/types';

interface AnsweredQuestion extends QuestionCardQuestion {
  answer?: Answer | null;
}

interface AnsweredQuestionCardProps {
  readonly question: AnsweredQuestion;
  readonly answer: string[];
}

export function AnsweredQuestionCard({ question, answer }: AnsweredQuestionCardProps) {
  const { t } = useTranslation();
  const correct = new Set(question.answer?.correctOptions ?? []);
  const selected = new Set(answer ?? []);
  const isCorrectlyAnswered = Array.from(correct).every((opt) => selected.has(opt)) && correct.size === selected.size;

  function renderOptionAlerts() {
    return Object.entries(question.options).map(([key, val]) => {
      const isCorrect = correct.has(key);
      const isSelected = selected.has(key);
      let color: 'success' | 'danger' | undefined = undefined;

      if (isSelected && isCorrect) color = 'success';
      else if (isSelected && !isCorrect) color = 'danger';

      return (
        <Alert
          key={key}
          hideIconWrapper
          classNames={{ title: 'text-xs', description: 'text-xs', base: 'py-1 px-2', alertIcon: 'w-6 h-6' }}
          color={color}
          title={typeof val === 'string' ? val : JSON.stringify(val)}
        />
      );
    });
  }

  function renderExplanations() {
    return Object.entries(question.answer?.explanations ?? {}).map(([key, val]) => (
      <Alert
        key={key}
        hideIconWrapper
        classNames={{ title: 'text-xs', description: 'text-xs', base: 'py-1 px-2', alertIcon: 'w-6 h-6' }}
        color={correct.has(key) ? 'success' : 'danger'}
        title={typeof val === 'string' ? val : JSON.stringify(val)}
      />
    ));
  }

  return (
    <>
      <div className="bg-content1 border border-default-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 pb-3 mb-3 border-b border-divider">
          <div className="flex items-center justify-between flex-1">
            <h4 className="font-semibold text-foreground text-sm leading-relaxed">
              <span className="inline-block mr-2 text-default-400">{String(question.id).padStart(2, '0')}.</span>
              {question.text}
            </h4>
            {isCorrectlyAnswered ? (
              <FontAwesomeIcon className="text-success text-xl flex-shrink-0 ml-3" icon={faCircleCheck} />
            ) : (
              <FontAwesomeIcon className="text-danger text-xl flex-shrink-0 ml-3" icon={faCircleXmark} />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">{renderOptionAlerts()}</div>
      </div>
      <div className="bg-content1 border border-default-200 rounded-xl p-5">
        <h4 className="font-semibold text-default-500 text-xs uppercase tracking-wider mb-3">
          {t('quiz.explanations')}
        </h4>
        <div className="flex flex-col gap-1.5">{renderExplanations()}</div>
      </div>
    </>
  );
}
