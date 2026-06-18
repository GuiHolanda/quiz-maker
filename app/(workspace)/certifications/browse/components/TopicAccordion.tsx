'use client';
import { useEffect, useRef, useState } from 'react';

import { QuestionList } from './QuestionList';

import { StoredQuestion, BrowseTopicSummary } from '@/shared/types';
import { getBrowseQuestions, deleteBrowseQuestion } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

interface TopicAccordionProps {
  readonly topic: BrowseTopicSummary;
  readonly certificationTitle: string;
  readonly isOpen: boolean;
}

export function TopicAccordion({ topic, certificationTitle, isOpen }: TopicAccordionProps) {
  const { t } = useTranslation();
  const hasFetched = useRef(false);
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      hasFetched.current = true;
      fetchQuestions(1, pageSize);
    }
  }, [isOpen]);

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
    } catch {
      notify.error(t('toast.failedToLoad'), t('browse.loadError'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteBrowseQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotal((prev) => prev - 1);
      notify.success(t('toast.success'), t('browse.deleteSuccess'));
    } catch {
      notify.error(t('toast.error'), t('browse.deleteError'));
    }
  }

  return (
    <QuestionList
      isLoading={isLoading}
      page={page}
      pageSize={pageSize}
      questions={questions}
      total={total}
      onDelete={handleDelete}
      onPageChange={(p) => fetchQuestions(p, pageSize)}
      onPageSizeChange={(ps) => fetchQuestions(1, ps)}
    />
  );
}
