'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useGlobalSearch } from '@/features/hooks/useGlobalSearch.hook';
import { SearchDropdown } from '@/shared/components/ui/workspace-header/SearchDropdown';

export function HeaderSearch() {
  const { t } = useTranslation();
  const { query, setQuery, results, isLoading, isOpen, navigate, inputRef } = useGlobalSearch();

  return (
    <div className="flex-1 max-w-lg relative" data-search-container>
      <FontAwesomeIcon
        className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400 w-3 h-3"
        icon={faMagnifyingGlass}
      />
      <input
        ref={inputRef}
        aria-label={t('header.searchPlaceholder')}
        className="w-full text-xs text-foreground bg-content1 border border-default-200 rounded-lg px-3 py-2 pl-8 placeholder:text-default-400 transition-colors duration-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        placeholder={t('header.searchPlaceholder')}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('');
          }
        }}
      />
      {isOpen && (
        <SearchDropdown
          isLoading={isLoading}
          results={results}
          onSelect={navigate}
        />
      )}
    </div>
  );
}
