import { StoredQuestion } from '@/types';
import { Alert } from '@heroui/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface QuestionCardProps {
  readonly question: StoredQuestion;
  readonly answer: string[];
}

export function AnsweredQuestionCard({ question, answer }: QuestionCardProps) {
  const { t } = useTranslation();
  const correct = new Set(question.answer?.correctOptions || []);
  const selected = new Set(answer || []);
  const isCorrectlyAnswered = Array.from(correct).every((opt) => selected.has(opt)) && correct.size === selected.size;

  function renderOptionAlerts() {
    return Object.entries(question.options).map(([key, val]) => {
      const isCorrect = correct.has(key);
      const isSelected = selected.has(key);

      let color: 'success' | 'danger' | 'warning' | undefined = undefined;
      if (isSelected && isCorrect) color = 'success';
      else if (isSelected && !isCorrect) color = 'danger';

      const optionText = typeof val === 'string' ? val : JSON.stringify(val);
      return (
        <Alert
          hideIconWrapper
          key={key}
          color={color}
          title={optionText}
          classNames={{
            title: 'text-xs',
            description: 'text-xs',
            base: 'py-1 px-2',
            alertIcon: 'w-6 h-6',
          }}
        />
      );
    });
  }

  function renderExplanations() {
    return Object.entries(question.answer?.explanations || {}).map(([key, val]) => {
      const explanationText = typeof val === 'string' ? val : JSON.stringify(val);
      const isCorrect = correct.has(key);

      return (
        <Alert
          hideIconWrapper
          key={key}
          color={isCorrect ? 'success' : 'danger'}
          title={explanationText}
          classNames={{
            title: 'text-xs',
            description: 'text-xs',
            base: 'py-1 px-2',
            alertIcon: 'w-6 h-6',
          }}
        />
      );
    });
  }

  return (
    <>
      <div className="clay-question-card p-5">
        <div className="flex items-start justify-between gap-4 pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between flex-1">
            <h4 className="font-semibold text-white/80 text-sm leading-relaxed">
              <span className="inline-block mr-2 text-white/35">{String(question.id).padStart(2, '0')}.</span>
              {question.text}
            </h4>
            {isCorrectlyAnswered ? (
              <FontAwesomeIcon icon={faCircleCheck} className="text-success text-xl flex-shrink-0 ml-3" />
            ) : (
              <FontAwesomeIcon icon={faCircleXmark} className="text-danger text-xl flex-shrink-0 ml-3" />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">{renderOptionAlerts()}</div>
      </div>

      <div className="clay-question-card p-5">
        <h4 className="font-semibold text-white/50 text-xs uppercase tracking-wider mb-3">{t('quiz.explanations')}</h4>
        <div className="flex flex-col gap-1.5">{renderExplanations()}</div>
      </div>
    </>
  );
}
