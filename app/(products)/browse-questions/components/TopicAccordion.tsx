'use client';
import { useRef, useState } from 'react';
import type { Selection } from '@react-types/shared';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { addToast } from '@heroui/toast';
import { StoredQuestion, BrowseTopicSummary } from '@/shared/types';
import { getBrowseQuestions, deleteBrowseQuestion } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { QuestionList } from './QuestionList';
import { QuestionDetailPanel } from './QuestionDetailPanel';

interface TopicAccordionProps {
  readonly topic: BrowseTopicSummary;
  readonly certificationTitle: string;
}

export function TopicAccordion({ topic, certificationTitle }: TopicAccordionProps) {
  const { t } = useTranslation();
  const hasFetched = useRef(false);
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<StoredQuestion | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchQuestions(nextPage: number, nextPageSize: number) {
    setIsLoading(true);
    try {
      const data = await getBrowseQuestions({
        certificationTitle,
        topic: topic.name,
        page: nextPage,
        pageSize: nextPageSize,
      });
      setQuestions(data.questions);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
      setSelectedQuestion(null);
    } catch {
      addToast({ title: t('toast.failedToLoad'), description: t('browse.loadError'), color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectionChange(keys: Selection) {
    const hasSelection = keys === 'all' || (keys instanceof Set && keys.size > 0);
    if (hasSelection && !hasFetched.current) {
      hasFetched.current = true;
      fetchQuestions(1, pageSize);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteBrowseQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotal((prev) => prev - 1);
      setSelectedQuestion(null);
      addToast({ title: t('toast.success'), description: t('browse.deleteSuccess'), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('browse.deleteError'), color: 'danger' });
    }
  }

  return (
    <Accordion
      onSelectionChange={handleSelectionChange}
      className="bg-content2 border border-default-100 rounded-lg overflow-hidden p-0"
      itemClasses={{
        base: 'border-0',
        title: 'font-medium text-foreground text-sm',
        trigger: 'px-4 py-2.5 hover:bg-default-100 transition-colors duration-200',
        content: 'p-0',
        indicator: 'text-default-400',
      }}
    >
      <AccordionItem
        key={topic.name}
        title={
          <div className="flex items-center gap-3">
            <span>{topic.name}</span>
            <span className="bg-primary-100 text-primary-700 text-xs font-semibold rounded-full px-2 py-0.5">
              {topic.questionCount}
            </span>
          </div>
        }
      >
        <div className="flex border-t border-default-100" style={{ minHeight: '260px' }}>
          <div className="w-[42%] border-r border-default-100">
            <QuestionList
              questions={questions}
              selectedQuestion={selectedQuestion}
              onSelectQuestion={setSelectedQuestion}
              page={page}
              pageSize={pageSize}
              total={total}
              isLoading={isLoading}
              onPageChange={(p) => fetchQuestions(p, pageSize)}
              onPageSizeChange={(ps) => fetchQuestions(1, ps)}
            />
          </div>
          <div className="w-[58%]">
            <QuestionDetailPanel question={selectedQuestion} onDelete={handleDelete} />
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  );
}
