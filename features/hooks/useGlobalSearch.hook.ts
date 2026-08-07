'use client';

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearch } from '@/features/connectors';
import type { SearchResultItem } from '@/shared/types';

export function useGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const deferredQuery = useDeferredValue(query);

  const isOpen = query.length >= 3 && (isLoading || results.length > 0);

  const close = useCallback(() => {
    setQuery('');
    setResults([]);
    setFocusedIndex(-1);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  function handleInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      navigate(results[focusedIndex].href);
    } else if (e.key === 'Escape') {
      close();
    }
  }

  useEffect(() => {
    setFocusedIndex(-1);
  }, [deferredQuery]);

  useEffect(() => {
    if (deferredQuery.length < 3) {
      setIsLoading(false);
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    globalSearch(deferredQuery, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResults(data.results);
      })
      .catch(() => {
        if (!controller.signal.aborted) setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
  }, [deferredQuery]);

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

  return { query, setQuery, results, isLoading, isOpen, close, navigate, inputRef, focusedIndex, handleInputKeyDown };
}
