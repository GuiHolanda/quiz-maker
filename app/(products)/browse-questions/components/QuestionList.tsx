'use client';
import React from 'react';
import { Skeleton } from '@heroui/skeleton';
import { StoredQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';

interface QuestionListProps {
  readonly questions: StoredQuestion[];
  readonly selectedQuestion: StoredQuestion | null;
  readonly onSelectQuestion: (q: StoredQuestion) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly isLoading: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export function QuestionList({
  questions,
  selectedQuestion,
  onSelectQuestion,
  page,
  pageSize,
  total,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: QuestionListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleItemsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = Number(e.target.value) || 1;
    onPageSizeChange(v);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </>
        ) : (
          questions.map((q) => {
            const isSelected = selectedQuestion?.id === q.id;
            return (
              <button
                key={q.id}
                onClick={() => onSelectQuestion(q)}
                className={`w-full text-left rounded-lg p-2.5 border transition-colors duration-150 ${
                  isSelected
                    ? 'bg-primary-50 border-primary-200 text-primary'
                    : 'bg-content1 border-default-100 text-foreground hover:bg-content2'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs rounded px-1.5 py-0.5 bg-default-100 text-default-500 capitalize">
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs leading-snug line-clamp-2">{q.text}</p>
              </button>
            );
          })
        )}
      </div>
      {!isLoading && total > 0 && (
        <div className="border-t border-default-100 p-2 flex items-center gap-2 flex-wrap">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onChange={onPageChange}
          />
          <div className="ml-auto">
            <ItemsPerPageSelect value={pageSize} onChange={handleItemsPerPageChange} />
          </div>
        </div>
      )}
    </div>
  );
}
