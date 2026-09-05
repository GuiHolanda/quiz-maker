'use client';

import { Tabs, Tab } from '@heroui/tabs';
import { Select, SelectItem } from '@heroui/select';

import { countByTab, type ExamListSort, type ExamListTab } from './examsListFilters';

import { SearchInput } from '@/shared/components/ui/SearchInput';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import type { Exam } from '@/shared/types';

interface ExamsListToolbarProps {
  readonly exams: Exam[];
  readonly tab: ExamListTab;
  readonly onTabChange: (tab: ExamListTab) => void;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly sort: ExamListSort;
  readonly onSortChange: (sort: ExamListSort) => void;
}

function tabTitle(label: string, count: number) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <span className="font-mono text-[11px] opacity-70">{count}</span>
    </span>
  );
}

export function ExamsListToolbar({
  exams,
  tab,
  onTabChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: ExamsListToolbarProps) {
  const { t } = useTranslation();

  const TABS: { key: ExamListTab; label: string }[] = [
    { key: 'all', label: t('exam.tabAll') },
    { key: 'certification', label: t('nav.certifications') },
    { key: 'public_exam', label: t('nav.publicExams') },
    { key: 'draft', label: t('exam.tabDrafts') },
  ];

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <Tabs
        classNames={{
          tabList: 'bg-content2 rounded-xl p-1 gap-1',
          tab: 'text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold',
          cursor: 'bg-primary rounded-xl',
        }}
        selectedKey={tab}
        onSelectionChange={(key) => onTabChange(key as ExamListTab)}
      >
        {TABS.map(({ key, label }) => (
          <Tab key={key} title={tabTitle(label, countByTab(exams, key))} />
        ))}
      </Tabs>

      <div className="flex items-center gap-2">
        <SearchInput
          ariaLabel={t('exam.searchPlaceholder')}
          placeholder={t('exam.searchPlaceholder')}
          testId="exams-search"
          value={search}
          onValueChange={onSearchChange}
        />
        <Select
          {...inputProperties.select}
          aria-label={t('exam.sortActivity')}
          className="w-44"
          data-testid="exams-sort-select"
          disallowEmptySelection
          selectedKeys={new Set([sort])}
          onSelectionChange={(keys) => onSortChange(Array.from(keys)[0] as ExamListSort)}
        >
          <SelectItem key="activity">{t('exam.sortActivity')}</SelectItem>
          <SelectItem key="name">{t('exam.sortName')}</SelectItem>
          <SelectItem key="readiness">{t('exam.sortReadiness')}</SelectItem>
        </Select>
      </div>
    </div>
  );
}
