'use client';

import { Key, useState } from 'react';
import { Tab, Tabs } from '@heroui/tabs';
import { MockExamsProvider } from '@/features/providers/mockExams.provider';
import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { NewSimuladoTab } from './components/NewSimuladoTab';
import { SimuladosListTab } from './components/SimuladosListTab';

function SimuladosPageContent() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('new');

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('simulado.pageTitle')}</h1>
        <p className="text-default-500 mt-1">{t('simulado.pageSubtitle')}</p>
      </div>
      <Tabs
        aria-label={t('simulado.pageTitle')}
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
        <Tab key="new" title={t('simulado.tabNew')}>
          <NewSimuladoTab onCreated={() => setSelectedTab('list')} />
        </Tab>
        <Tab key="list" title={t('simulado.tabList')}>
          <SimuladosListTab />
        </Tab>
      </Tabs>
    </div>
  );
}

export default function SimuladosPage() {
  return (
    <PublicExamsProvider>
      <MockExamsProvider>
        <SimuladosPageContent />
      </MockExamsProvider>
    </PublicExamsProvider>
  );
}
