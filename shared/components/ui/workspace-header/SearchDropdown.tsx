'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCertificate,
  faFileAlt,
  faLayerGroup,
  faTags,
  faQuestionCircle,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { SearchResultItem, SearchResultType } from '@/shared/types';

const CATEGORY_ORDER: SearchResultType[] = ['certification', 'publicExam', 'simulado', 'topic', 'question'];

const CATEGORY_ICONS: Record<SearchResultType, IconDefinition> = {
  certification: faCertificate,
  publicExam: faFileAlt,
  simulado: faLayerGroup,
  topic: faTags,
  question: faQuestionCircle,
};

const CATEGORY_I18N_KEYS: Record<SearchResultType, string> = {
  certification: 'search.category.certifications',
  publicExam: 'search.category.publicExams',
  simulado: 'search.category.simulados',
  topic: 'search.category.topics',
  question: 'search.category.questions',
};

interface SearchDropdownProps {
  readonly results: SearchResultItem[];
  readonly isLoading: boolean;
  readonly focusedIndex: number;
  readonly onSelect: (href: string) => void;
}

export function SearchDropdown({ results, isLoading, focusedIndex, onSelect }: SearchDropdownProps) {
  const { t } = useTranslation();

  const grouped = CATEGORY_ORDER.reduce<Record<SearchResultType, SearchResultItem[]>>(
    (acc, type) => {
      acc[type] = results.filter((r) => r.type === type);
      return acc;
    },
    { certification: [], publicExam: [], simulado: [], topic: [], question: [] }
  );

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-content1 border border-default-200 rounded-xl shadow-md overflow-hidden">
      {isLoading && results.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-default-400">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
          {t('search.loading')}
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <p className="px-4 py-3 text-xs text-default-400">{t('search.noResults')}</p>
      )}

      {CATEGORY_ORDER.map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;

        return (
          <div key={type}>
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-primary">{t(CATEGORY_I18N_KEYS[type])}</p>
            {items.map((item) => {
              const flatIndex = results.indexOf(item);
              const isFocused = flatIndex === focusedIndex;

              return (
                <button
                  key={item.id}
                  className={`w-full flex items-start gap-3 px-4 py-2 transition-colors duration-150 text-left ${isFocused ? 'bg-content2' : 'hover:bg-content2'}`}
                  onClick={() => onSelect(item.href)}
                >
                  <FontAwesomeIcon
                    icon={CATEGORY_ICONS[item.type]}
                    className="mt-0.5 w-3 h-3 text-default-400 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">{item.label}</p>
                    {item.subtitle && <p className="text-xs text-default-400 line-clamp-1">{item.subtitle}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
