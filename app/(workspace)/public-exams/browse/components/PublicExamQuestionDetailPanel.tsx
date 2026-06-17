'use client';
import { StoredPublicExamQuestion } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface PublicExamQuestionDetailPanelProps {
  readonly question: StoredPublicExamQuestion | null;
  readonly onDelete: (id: number) => void;
  readonly onClose: () => void;
}

export function PublicExamQuestionDetailPanel({
  question,
  onDelete,
}: PublicExamQuestionDetailPanelProps) {
  const { t } = useTranslation();

  if (!question) return null;

  const options = Object.entries(question.options);
  const correctOptions = question.answer?.correctOptions ?? [];
  const explanations = question.answer?.explanations ?? {};

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto border-b border-default-100">
      <div className="flex flex-col gap-1.5 mb-3">
        {options.map(([label, text]) => {
          const isCorrect = correctOptions.includes(label);
          return (
            <div key={label} className="flex gap-2 items-start text-xs">
              <span
                className={`flex-shrink-0 rounded px-1.5 py-0.5 font-semibold ${
                  isCorrect
                    ? 'bg-success-100 text-success-700'
                    : 'bg-default-100 text-default-500'
                }`}
              >
                {label} {isCorrect ? '✓' : ''}
              </span>
              <span className="text-foreground leading-snug font-semibold">{text}</span>
            </div>
          );
        })}
      </div>

      {Object.keys(explanations).length > 0 && (
        <div className="border-t border-default-100 pt-3 mb-4 flex flex-col gap-2">
          {Object.entries(explanations).map(([label, explanation]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-primary mb-0.5">{t('concurso.explanation', { label })}</p>
              <p className="text-xs text-default-500 leading-snug">{explanation}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex justify-end pt-2">
        <button
          onClick={() => onDelete(question.id)}
          className="text-xs bg-danger-50 text-danger border border-danger-200 rounded-lg px-3 py-1.5 hover:bg-danger-100 transition-colors"
        >
          {t('browse.deleteQuestion')}
        </button>
      </div>
    </div>
  );
}
