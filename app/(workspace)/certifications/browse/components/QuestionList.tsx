'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@heroui/skeleton';

import { QuestionDetailPanel } from './QuestionDetailPanel';

import { StoredQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';

interface QuestionListProps {
  readonly questions: StoredQuestion[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly isLoading: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly onDelete: (id: number) => Promise<void>;
}

export function QuestionList({
  questions,
  page,
  pageSize,
  total,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onDelete,
}: QuestionListProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleItemsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onPageSizeChange(Number(e.target.value) || 1);
  }

  async function handleDelete(id: number) {
    await onDelete(id);
    setSelectedId(null);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-14 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-14 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </>
        ) : (
          questions.map((q) => {
            const isSelected = selectedId === q.id;

            return (
              <React.Fragment key={q.id}>
                <button
                  className={`w-full text-left p-4 border-b-2 border-default-100 text-foreground transition-colors duration-150 ${
                    isSelected ? 'bg-content2' : 'bg-content1 hover:bg-content2'
                  }`}
                  onClick={() => setSelectedId(isSelected ? null : q.id)}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-xs rounded px-1.5 py-0.5 bg-default-100 text-default-500 capitalize">
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-xs leading-snug font-extrabold">{q.text}</p>
                </button>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      key={`detail-${q.id}`}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <QuestionDetailPanel question={q} onClose={() => setSelectedId(null)} onDelete={handleDelete} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })
        )}
      </div>
      {!isLoading && total > 0 && (
        <div className="p-4 flex items-center gap-2 flex-wrap">
          <PaginationControls currentPage={page} totalPages={totalPages} onChange={onPageChange} />
          <div className="ml-auto">
            <ItemsPerPageSelect value={pageSize} onChange={handleItemsPerPageChange} />
          </div>
        </div>
      )}
    </div>
  );
}
