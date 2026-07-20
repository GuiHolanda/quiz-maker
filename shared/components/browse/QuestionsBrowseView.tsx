'use client';
import type { Selection } from '@react-types/shared';

import { MotionConfig } from 'framer-motion';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Skeleton } from '@heroui/skeleton';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { BrowseQuestionsToolbar } from './BrowseQuestionsToolbar';
import type { BrowseCategoryNode, BrowseDomainConfig } from './types';

import { QuestionsByCategoryPanel } from '@/shared/components/QuestionsByCategoryPanel';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { notify } from '@/shared/lib/notify';

interface QuestionsBrowseViewProps<T> {
  readonly config: BrowseDomainConfig<T>;
  readonly embedded?: boolean;
  readonly onGenerateClick?: () => void;
}

function normalize(text: string) {
  // Strip combining diacritical marks (Unicode U+0300–U+036F) without using
  // the `\p{Diacritic}` Unicode class — that requires ES2018+ target.
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function QuestionsBrowseView<T>({ config, embedded, onGenerateClick }: QuestionsBrowseViewProps<T>) {
  const { t } = useTranslation();
  const { i18nPrefix } = config;
  const [categories, setCategories] = useState<readonly BrowseCategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [openSubcategoryId, setOpenSubcategoryId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loadedQuestionIds, setLoadedQuestionIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;

    config
      .fetchSummary()
      .then((raw) => {
        if (cancelled) return;
        setCategories(config.mapSummary(raw));
      })
      .catch(() => {
        if (!cancelled) notify.error(t('toast.failedToLoad'), t('browse.loadError'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config, t]);

  const totalQuestions = useMemo(() => categories.reduce((sum, c) => sum + c.totalCount, 0), [categories]);

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery.trim());

    if (!q) return categories.map((c) => ({ category: c, matchedChildren: c.children }));

    return categories
      .map((category) => {
        const catMatch = normalize(category.label).includes(q);
        const matchedChildren = category.children.filter((child) => normalize(child.label).includes(q));

        if (catMatch) return { category, matchedChildren: category.children };
        if (matchedChildren.length > 0) return { category, matchedChildren };
        return null;
      })
      .filter(
        (v): v is { category: BrowseCategoryNode; matchedChildren: BrowseCategoryNode['children'] } => v !== null
      );
  }, [categories, deferredQuery]);

  // While a query is active, auto-open the first matching category if none is
  // open. Avoid clobbering the user's manual pick.
  useEffect(() => {
    if (!deferredQuery.trim() || openCategoryId) return;
    const first = filtered[0]?.category.id;

    if (first) setOpenCategoryId(first);
  }, [deferredQuery, filtered, openCategoryId]);

  function handleCategorySelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const key = keys instanceof Set && keys.size > 0 ? String(Array.from(keys)[0]) : null;

    setOpenCategoryId(key);
    // Closing/changing category invalidates any open subcategory + selection.
    setOpenSubcategoryId(null);
    setSelectedIds(new Set());
    setLoadedQuestionIds([]);
  }

  function handleSubcategorySelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const key = keys instanceof Set && keys.size > 0 ? String(Array.from(keys)[0]) : null;

    setOpenSubcategoryId(key);
    setSelectedIds(new Set());
    setLoadedQuestionIds([]);
  }

  function handleToggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleToggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(loadedQuestionIds) : new Set());
  }

  const allSelected = loadedQuestionIds.length > 0 && selectedIds.size === loadedQuestionIds.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < loadedQuestionIds.length;

  const body = renderBody();

  if (embedded) return body;

  return (
    <PageHeader
      subtitle={isLoading ? '' : t(`${i18nPrefix}.subtitle`, { total: totalQuestions, count: categories.length })}
      title={t(`${i18nPrefix}.title`)}
    >
      {body}
    </PageHeader>
  );

  function renderBody() {
    if (isLoading) return renderSkeleton();
    if (categories.length === 0) return renderEmpty();

    return (
      <MotionConfig reducedMotion="user">
        <div className="flex flex-col gap-4">
          {renderSearch()}
          {filtered.length === 0 ? renderNoResults() : renderCategoryAccordion()}
        </div>
      </MotionConfig>
    );
  }

  function renderSkeleton() {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  function renderEmpty() {
    return (
      <EmptyState
        action={onGenerateClick ? { label: t(`${i18nPrefix}.generateCta`), onPress: onGenerateClick } : undefined}
        description={t(`${i18nPrefix}.noQuestionsDescription`)}
        title={t(`${i18nPrefix}.noQuestions`)}
      />
    );
  }

  function renderSearch() {
    return (
      <Input
        {...inputProperties.input}
        aria-label={t(`${i18nPrefix}.searchPlaceholder`)}
        placeholder={t(`${i18nPrefix}.searchPlaceholder`)}
        size="sm"
        startContent={<FontAwesomeIcon className="text-default-400 h-3.5 w-3.5" icon={faSearch} />}
        value={query}
        onValueChange={setQuery}
      />
    );
  }

  function renderNoResults() {
    return (
      <div className="bg-content1 border border-default-200 rounded-xl px-4 py-8 text-sm text-default-500 text-center">
        {t(`${i18nPrefix}.searchNoResults`, { query })}
      </div>
    );
  }

  function renderCategoryAccordion() {
    return (
      <Accordion
        className="flex flex-col gap-4 p-0 shadow-none"
        itemClasses={{
          base: 'bg-content1 border border-default-200 rounded-xl overflow-hidden',
          title: 'font-semibold text-foreground',
          titleWrapper: 'overflow-hidden min-w-0',
          trigger: 'px-4 py-3 hover:bg-content2 transition-colors duration-200',
          content: 'px-4 pb-3',
          indicator: 'text-default-400',
        }}
        selectedKeys={openCategoryId ? [openCategoryId] : []}
        selectionMode="single"
        showDivider={false}
        onSelectionChange={handleCategorySelectionChange}
      >
        {filtered.map(({ category, matchedChildren }) => renderCategoryItem(category, matchedChildren))}
      </Accordion>
    );
  }

  function renderCategoryItem(category: BrowseCategoryNode, matchedChildren: BrowseCategoryNode['children']) {
    return (
      <AccordionItem key={category.id} title={renderCategoryTitle(category)}>
        {renderSubcategoryAccordion(category, matchedChildren)}
      </AccordionItem>
    );
  }

  function renderCategoryTitle(category: BrowseCategoryNode) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="truncate text-sm" title={category.label}>
            {category.label}
          </span>
          {category.sublabel && (
            <span className="truncate text-xs text-default-400 font-normal" title={category.sublabel}>
              {category.sublabel}
            </span>
          )}
        </div>
        <Chip className="flex-shrink-0" color="secondary" size="sm" variant="flat">
          {category.totalCount}
        </Chip>
      </div>
    );
  }

  function renderSubcategoryAccordion(category: BrowseCategoryNode, matchedChildren: BrowseCategoryNode['children']) {
    return (
      <Accordion
        className="flex flex-col gap-2 p-0 shadow-none"
        itemClasses={{
          base: 'bg-content1 border border-default-100 rounded-lg overflow-hidden',
          title: 'font-medium text-foreground text-sm',
          titleWrapper: 'overflow-hidden min-w-0',
          trigger: 'px-4 py-2.5 hover:bg-content2 transition-colors duration-200',
          content: 'p-0',
          indicator: 'text-default-400',
        }}
        selectedKeys={openSubcategoryId ? [openSubcategoryId] : []}
        selectionMode="single"
        showDivider={false}
        onSelectionChange={handleSubcategorySelectionChange}
      >
        {matchedChildren.map((child) => renderSubcategoryItem(category, child))}
      </Accordion>
    );
  }

  function renderSubcategoryItem(category: BrowseCategoryNode, child: BrowseCategoryNode['children'][number]) {
    const isOpen = openSubcategoryId === child.id;
    const leafKey = `${category.id}::${child.id}`;

    return (
      <AccordionItem key={child.id} title={renderSubcategoryTitle(child, isOpen, leafKey)}>
        <QuestionsByCategoryPanel
          key={leafKey}
          deleteQuestion={config.deleteQuestion}
          fetchPage={(page, pageSize) => config.fetchQuestions(category, child, page, pageSize)}
          isOpen={isOpen}
          selectedIds={selectedIds}
          onQuestionsLoaded={setLoadedQuestionIds}
          onRegisterBulkTrigger={(fn) => bulkDeleteTriggers.set(leafKey, fn)}
          onSelectionChange={setSelectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </AccordionItem>
    );
  }

  function renderSubcategoryTitle(child: BrowseCategoryNode['children'][number], isOpen: boolean, leafKey: string) {
    return (
      <div className="flex items-center gap-3 min-w-0 w-full">
        <span className="truncate flex-1 min-w-0 text-sm" title={child.label}>
          {child.label}
        </span>
        {isOpen && loadedQuestionIds.length > 0 ? (
          <BrowseQuestionsToolbar
            allSelected={allSelected}
            isIndeterminate={isIndeterminate}
            loadedCount={loadedQuestionIds.length}
            selectedCount={selectedIds.size}
            totalInLeaf={child.questionCount}
            onBulkDelete={() => bulkDeleteTriggers.get(leafKey)?.()}
            onToggleSelectAll={handleToggleSelectAll}
          />
        ) : (
          <Chip className="flex-shrink-0" color="primary" size="sm" variant="flat">
            {child.questionCount}
          </Chip>
        )}
      </div>
    );
  }
}

// Module-scoped map is fine here: leafKey is namespaced by category+subcategory
// ids which are unique per browse view instance; only the currently-open leaf
// ever calls its trigger, and stale entries are harmless.
const bulkDeleteTriggers = new Map<string, () => void>();
