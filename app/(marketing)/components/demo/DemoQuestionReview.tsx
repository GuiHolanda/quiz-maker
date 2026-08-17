'use client';

import { useState } from 'react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoQuestion } from '@/shared/types';
import { BlueprintFrame } from '@/app/(marketing)/components/shared/BlueprintFrame';
import { DemoPagination } from './DemoPagination';
import { DemoReviewQuestion } from './DemoReviewQuestion';

interface DemoQuestionReviewProps {
  readonly questions: readonly DemoQuestion[];
  readonly answers: Record<string, number[]>;
  readonly results: readonly boolean[];
}

const REVIEW_PAGE_SIZE = 5;

// Owns its own pagination: paging through the review is not a concern of the
// diagnosis panel, and keeping the state here stops a page change from
// re-rendering the score and topic sections.
export function DemoQuestionReview({ questions, answers, results }: DemoQuestionReviewProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(questions.length / REVIEW_PAGE_SIZE);
  const pageStart = page * REVIEW_PAGE_SIZE;
  const pageQuestions = questions.slice(pageStart, pageStart + REVIEW_PAGE_SIZE);

  return (
    <BlueprintFrame>
      <div className="px-5 py-4 border-b border-mkt-divider">
        <span className="ds-heading text-mkt-text text-lg">{t('demo.step4.reviewHeading')}</span>
      </div>

      {pageQuestions.map((question, offset) => {
        const index = pageStart + offset;

        return (
          <DemoReviewQuestion
            key={index}
            question={question}
            index={index}
            totalQuestions={questions.length}
            selected={answers[index] ?? []}
            isCorrect={results[index] ?? false}
          />
        );
      })}

      <DemoPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        prevLabel={t('demo.step4.reviewPrevPage')}
        nextLabel={t('demo.step4.reviewNextPage')}
        className="px-5 py-4 border-t border-mkt-divider"
      />

      <div className="px-5 pb-4">
        <p className="text-xs text-mkt-text opacity-40">{t('demo.step4.reviewNote')}</p>
      </div>
    </BlueprintFrame>
  );
}
