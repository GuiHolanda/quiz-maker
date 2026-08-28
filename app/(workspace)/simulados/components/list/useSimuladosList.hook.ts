'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { normalizeMock, UnifiedSimulado } from './normalizeSimulado';

import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { usePaginatedItems } from '@/features/hooks/usePaginatedItems.hook';

export type StatusFilter = 'all' | 'pending' | 'in_progress' | 'answered';
export type SortOption = 'recent' | 'oldest' | 'bestScore' | 'name';

function bestScoreRatio(simulado: UnifiedSimulado): number {
  if (simulado.bestScore == null) return -1;

  return simulado.bestScore / Math.max(simulado.totalQuestions, 1);
}

export function useSimuladosList() {
  const mock = useMockExamsContext();

  const [search, setSearch] = useState('');
  const [exam, setExam] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('recent');

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    mock.refresh();
  }, [mock.refresh]);

  const simulados = useMemo<UnifiedSimulado[]>(() => mock.mockExams.map(normalizeMock), [mock.mockExams]);

  const examOptions = useMemo(() => {
    const labels = new Set(simulados.map((simulado) => simulado.sourceLabel));

    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [simulados]);

  const hasActiveFilters = search.trim() !== '' || exam !== 'all' || status !== 'all';

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return simulados.filter((simulado) => {
      if (exam !== 'all' && simulado.sourceLabel !== exam) return false;
      if (status !== 'all' && simulado.status !== status) return false;
      if (query) {
        const haystack = `${simulado.name ?? ''} ${simulado.sourceLabel}`.toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [simulados, deferredSearch, exam, status]);

  const sorted = useMemo(() => {
    const items = [...filtered];

    switch (sort) {
      case 'oldest':
        return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'bestScore':
        return items.sort((a, b) => bestScoreRatio(b) - bestScoreRatio(a));
      case 'name':
        return items.sort((a, b) => (a.name ?? a.sourceLabel).localeCompare(b.name ?? b.sourceLabel));
      default:
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [filtered, sort]);

  const { pageItems, page, totalPages, perPage, setPage, setPerPage } = usePaginatedItems(sorted);

  const from = sorted.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, sorted.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  function clearFilters() {
    setSearch('');
    setExam('all');
    setStatus('all');
  }

  return {
    isLoading: mock.isLoading,
    isEmpty: mock.mockExams.length === 0,
    search,
    setSearch,
    exam,
    setExam,
    status,
    setStatus,
    sort,
    setSort,
    examOptions,
    hasActiveFilters,
    clearFilters,
    pageItems,
    page,
    setPage,
    totalPages,
    perPage,
    setPerPage,
    from,
    to,
    total: sorted.length,
    pageNumbers,
  };
}
