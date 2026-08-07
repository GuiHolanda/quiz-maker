'use client';

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearch } from '@/features/connectors';
import type { SearchResultItem } from '@/shared/types';

export function useGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const deferredQuery = useDeferredValue(query);

  const isOpen = query.length >= 3 && (isLoading || results.length > 0);

  const close = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    if (deferredQuery.length < 3) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);

    globalSearch(deferredQuery)
      .then((data) => setResults(data.results))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [deferredQuery]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (inputRef.current && !inputRef.current.closest('[data-search-container]')?.contains(target)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [close]);

  // ⌘K / Ctrl+K foca o input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { query, setQuery, results, isLoading, isOpen, close, navigate, inputRef };
}
