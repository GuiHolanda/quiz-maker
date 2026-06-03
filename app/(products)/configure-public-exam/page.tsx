'use client';
import { useState } from 'react';
import type { Key } from '@react-types/shared';
import { Tabs, Tab } from '@heroui/tabs';

import PublicExamsProvider from '@/features/providers/publicExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PublicExamsListTab } from './components/PublicExamsListTab';
import { NewPublicExamTab } from './components/NewPublicExamTab';

export default function ConfigurePublicExamPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('new');

  return (
    <PublicExamsProvider>
      <PageHeader title={t('concurso.pageTitle')} subtitle={t('concurso.pageSubtitle')} maxWidth="7xl">
        <div className="flex w-full flex-col">
          <Tabs
            aria-label={t('aria.tabOptions')}
            selectedKey={selectedTab as string}
            onSelectionChange={setSelectedTab}
            classNames={{
              tabList: 'bg-content1 border border-default-200 rounded-xl gap-1',
              tab: 'rounded-xl text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold transition-colors duration-200',
              tabContent: 'group-data-[selected=true]:text-foreground',
              cursor: 'bg-primary rounded-xl',
              panel: 'pt-4',
            }}
          >
            <Tab key="new" title={t('concurso.tabNew')}>
              <NewPublicExamTab onBackToLibrary={() => setSelectedTab('publicExamsList')} />
            </Tab>
            <Tab key="publicExamsList" title={t('concurso.tabList')}>
              <PublicExamsListTab />
            </Tab>
          </Tabs>
        </div>
      </PageHeader>
    </PublicExamsProvider>
  );
}
