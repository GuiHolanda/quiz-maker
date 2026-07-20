'use client';
import type { Key } from '@react-types/shared';

import { useState } from 'react';
import { Tabs, Tab } from '@heroui/tabs';

import { PublicExamsListTab } from './components/PublicExamsListTab';
import { NewPublicExamTab } from './components/NewPublicExamTab';

import PublicExamsProvider from '@/features/providers/publicExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export default function ConfigurePublicExamPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('publicExamsList');

  return (
    <PublicExamsProvider>
      <PageHeader maxWidth="7xl" subtitle={t('concurso.pageSubtitle')} title={t('concurso.pageTitle')}>
        <div className="flex w-full flex-col">
          <Tabs
            aria-label={t('aria.tabOptions')}
            classNames={{
              tabList: 'bg-content2 border border-default-200 rounded-xl p-1 gap-1',
              tab: 'rounded-xl text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold transition-colors duration-200',
              tabContent: 'group-data-[selected=true]:text-foreground',
              cursor: 'bg-primary rounded-xl',
              panel: 'pt-4',
            }}
            selectedKey={selectedTab as string}
            onSelectionChange={setSelectedTab}
          >
            <Tab key="publicExamsList" title={t('concurso.tabList')}>
              <PublicExamsListTab onCreateNew={() => setSelectedTab('new')} />
            </Tab>
            <Tab key="new" title={t('concurso.tabNew')}>
              <NewPublicExamTab onBackToLibrary={() => setSelectedTab('publicExamsList')} />
            </Tab>
          </Tabs>
        </div>
      </PageHeader>
    </PublicExamsProvider>
  );
}
