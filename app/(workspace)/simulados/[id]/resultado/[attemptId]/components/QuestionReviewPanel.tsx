'use client';

import { useMemo, useState } from 'react';
import { Select, SelectItem } from '@heroui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

import { ReviewQuestionRow } from './ReviewQuestionRow';
import type { ResultView } from './deriveResult';

interface QuestionReviewPanelProps {
  readonly view: ResultView;
  readonly onLoadExplanation: (questionId: number) => Promise<Record<string, string>>;
}

type StatusFilter = 'all' | 'correct' | 'wrong';

const PILL_BASE = 'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200';
const PILL_ACTIVE = 'border-primary bg-primary/10 text-primary';
const PILL_IDLE = 'border-divider text-default-500 hover:bg-content2 hover:text-foreground';

export function QuestionReviewPanel({ view, onLoadExplanation }: QuestionReviewPanelProps) {
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const topicOptions = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const question of view.questions) counts[question.sectionName] = (counts[question.sectionName] ?? 0) + 1;

    return [
      { key: 'all', label: t('simulado.result.allTopics') },
      ...view.topics.map((topic) => ({
        key: topic.sectionName,
        label: t('simulado.result.topicOption', { name: topic.sectionName, count: counts[topic.sectionName] ?? 0 }),
      })),
    ];
  }, [view.topics, view.questions, t]);

  const topicFiltered = useMemo(
    () => view.questions.filter((question) => topicFilter === 'all' || question.sectionName === topicFilter),
    [view.questions, topicFilter]
  );

  const statusCounts = {
    all: topicFiltered.length,
    correct: topicFiltered.filter((question) => question.status === 'correct').length,
    wrong: topicFiltered.filter((question) => question.status === 'wrong').length,
  };

  const filtered = topicFiltered.filter((question) => statusFilter === 'all' || question.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  const hasActiveFilters = topicFilter !== 'all' || statusFilter !== 'all';

  const statusPills: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: t('simulado.result.filterAll'), count: statusCounts.all },
    { key: 'correct', label: t('simulado.result.filterCorrect'), count: statusCounts.correct },
    { key: 'wrong', label: t('simulado.result.filterWrong'), count: statusCounts.wrong },
  ];

  function resetFilters() {
    setStatusFilter('all');
    setTopicFilter('all');
    setPage(1);
  }

  return (
    <div className="bg-content1 rounded-xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">{t('simulado.result.reviewTitle')}</h2>
          <p className="mt-1 text-sm text-default-500">{t('simulado.result.reviewSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusPills.map((pill) => (
            <button
              key={pill.key}
              className={`${PILL_BASE} ${statusFilter === pill.key ? PILL_ACTIVE : PILL_IDLE}`}
              type="button"
              onClick={() => {
                setStatusFilter(pill.key);
                setPage(1);
              }}
            >
              {pill.label} · {pill.count}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-default-500">{t('simulado.result.topicFilterLabel')}</span>
          <Select
            {...inputProperties.select}
            aria-label={t('simulado.result.topicFilterLabel')}
            className="w-60"
            disallowEmptySelection
            selectedKeys={[topicFilter]}
            size="sm"
            onSelectionChange={(keys) => {
              setTopicFilter((Array.from(keys)[0] as string) ?? 'all');
              setPage(1);
            }}
          >
            {topicOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
          {hasActiveFilters && (
            <button
              className="rounded-lg border border-divider px-3 py-1.5 text-xs text-default-500 transition-colors duration-200 hover:bg-content2 hover:text-foreground"
              type="button"
              onClick={resetFilters}
            >
              {t('simulado.result.clearFilters')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-default-500">{t('simulado.result.perPage')}</span>
          <Select
            {...inputProperties.select}
            aria-label={t('simulado.result.perPage')}
            className="w-20"
            disallowEmptySelection
            selectedKeys={[String(perPage)]}
            size="sm"
            onSelectionChange={(keys) => {
              setPerPage(Number(Array.from(keys)[0]) || 10);
              setPage(1);
            }}
          >
            <SelectItem key="5">5</SelectItem>
            <SelectItem key="10">10</SelectItem>
            <SelectItem key="20">20</SelectItem>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-default-500">{t('simulado.result.noQuestionsFilter')}</p>
        ) : (
          visible.map((question) => (
            <ReviewQuestionRow
              key={question.mockExamQuestionId}
              isOpen={openId === question.mockExamQuestionId}
              onLoadExplanation={onLoadExplanation}
              onToggle={() =>
                setOpenId((current) => (current === question.mockExamQuestionId ? null : question.mockExamQuestionId))
              }
              question={question}
            />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-4">
          <span className="text-xs text-default-500">
            {t('simulado.result.showingCount', {
              from: start + 1,
              to: start + visible.length,
              count: filtered.length,
            })}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                className="flex items-center gap-2 rounded-lg border border-divider px-3 py-1.5 text-xs text-default-500 transition-colors duration-200 hover:bg-content2 hover:text-foreground disabled:pointer-events-none disabled:opacity-45"
                disabled={currentPage === 1}
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                {t('simulado.result.prev')}
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`min-w-9 rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors duration-200 ${
                    pageNumber === currentPage ? PILL_ACTIVE : PILL_IDLE
                  }`}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                className="flex items-center gap-2 rounded-lg border border-divider px-3 py-1.5 text-xs text-default-500 transition-colors duration-200 hover:bg-content2 hover:text-foreground disabled:pointer-events-none disabled:opacity-45"
                disabled={currentPage === totalPages}
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                {t('simulado.result.next')}
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
