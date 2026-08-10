'use client';

import { useEffect, useState } from 'react';

const DEFAULT_PER_PAGE = 10;

interface PaginatedResult<T> {
  pageItems: T[];
  page: number;
  totalPages: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (count: number) => void;
}

export function usePaginatedItems<T>(items: T[], defaultPerPage = DEFAULT_PER_PAGE): PaginatedResult<T> {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  useEffect(() => {
    setPage(1);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  function handleSetPage(next: number) {
    setPage(Math.max(1, Math.min(next, totalPages)));
  }

  function handleSetPerPage(count: number) {
    setPerPage(count);
    setPage(1);
  }

  return { pageItems, page: safePage, totalPages, perPage, setPage: handleSetPage, setPerPage: handleSetPerPage };
}
