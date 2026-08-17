'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoCatalogExam, DemoQuestion } from '@/shared/types';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import { DemoStickyBar } from './DemoStickyBar';
import { DemoStepHeader } from './DemoStepHeader';
import { DemoBackButton } from './DemoBackButton';
import { DemoPagination } from './DemoPagination';
import { isAnswerComplete, selectionLimit } from './demoScoring';

interface DemoStep3QuizProps {
  readonly exam: DemoCatalogExam;
  readonly questions: DemoQuestion[];
  readonly answers: Record<string, number[]>;
  readonly page: number;
  readonly onAnswer: (questionIndex: number, optionIndex: number) => void;
  readonly onPageChange: (page: number) => void;
  readonly onFinish: () => void;
  readonly onBack: () => void;
}

const PAGE_SIZE = 5;

export function DemoStep3Quiz({
  exam,
  questions,
  answers,
  page,
  onAnswer,
  onPageChange,
  onFinish,
  onBack,
}: DemoStep3QuizProps) {
  const { t } = useTranslation();

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const pageQuestions = questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const answered = questions.filter((question, index) => isAnswerComplete(answers[index], question)).length;
  const allAnswered = answered === questions.length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <DemoBackButton onClick={onBack} label={t('demo.step3.backBtn')} className="mb-3 block" />
          <DemoStepHeader kick={t('demo.step3.kick')} heading={t('demo.step3.heading')} note={exam.name} />
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="mono text-xs text-mkt-text opacity-50">
            {t('demo.step3.pageLabel', { current: page + 1, total: totalPages })}
          </p>
          <p className="mono text-sm text-mkt-accent mt-1">
            {answered}/{questions.length}
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {pageQuestions.map((question, i) => {
          const globalIndex = page * PAGE_SIZE + i;
          const userAnswer = answers[globalIndex] ?? [];
          const limit = selectionLimit(question);

          return (
            <div key={globalIndex} className="blueprint overflow-visible p-6">
              <BlueprintCorners />
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="mono text-xs text-mkt-accent font-semibold">
                  {t('demo.step3.questionLabel', { n: globalIndex + 1, total: questions.length })}
                </span>
                <span className="mono text-xs text-mkt-accent border border-mkt-accent/30 px-2 py-0.5 flex-shrink-0">
                  {question.topic}
                </span>
              </div>

              <p className="text-mkt-text text-lg leading-relaxed mb-6">{question.text}</p>

              {limit > 1 && (
                <p className="mono text-xs text-mkt-accent mb-3">{t('demo.step3.selectCount', { n: limit })}</p>
              )}

              <div className="space-y-2">
                {question.options.map((option, optIdx) => {
                  const isSelected = userAnswer.includes(optIdx);
                  return (
                    <button
                      key={optIdx}
                      onClick={() => onAnswer(globalIndex, optIdx)}
                      className={`w-full text-left border px-4 py-3 text-sm transition-colors ${
                        isSelected
                          ? 'border-mkt-accent bg-mkt-accent/5 text-mkt-text'
                          : 'border-mkt-divider text-mkt-text hover:border-mkt-accent/50'
                      }`}
                    >
                      <span className="mono text-xs text-mkt-text opacity-40 mr-3">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <DemoPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        prevLabel={t('demo.step3.prevPage')}
        nextLabel={t('demo.step3.nextPage')}
        className="max-w-5xl mx-auto px-6 mt-6"
      >
        <span className="mono text-xs text-mkt-text opacity-40">
          {t('demo.step3.questionRange', {
            from: page * PAGE_SIZE + 1,
            to: Math.min((page + 1) * PAGE_SIZE, questions.length),
            total: questions.length,
          })}
        </span>
      </DemoPagination>

      <DemoStickyBar
        leftLabel={`${answered}/${questions.length} ${t('demo.step3.stickyAnswered')}`}
        leftAccent={allAnswered}
        rightHint={
          allAnswered
            ? t('demo.step3.stickyAllDone')
            : t('demo.step3.stickyRemaining', { n: questions.length - answered })
        }
        buttonLabel={t('demo.step3.finishBtn')}
        buttonDisabled={!allAnswered}
        onAction={onFinish}
      />
    </div>
  );
}
