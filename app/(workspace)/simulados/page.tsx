'use client';

import { Key, useState } from 'react';
import { Tab, Tabs } from '@heroui/tabs';

import { NewSimuladoTab } from './components/NewSimuladoTab';
import { SimuladosListTab } from './components/SimuladosListTab';

import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { CertSimuladosProvider } from '@/features/providers/certSimulados.provider';
import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import { MockExamsProvider } from '@/features/providers/mockExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';

function SimuladosPageContent() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('list');

  return (
    <PageHeader subtitle={t('simulado.pageSubtitle')} title={t('simulado.pageTitle')}>
      <div className="flex w-full flex-col">
        <Tabs
          aria-label={t('simulado.pageTitle')}
          classNames={{
            tabList: 'bg-content2 border border-default-200 rounded-xl p-1 gap-1',
            tab: 'text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold',
            cursor: 'bg-primary rounded-xl',
            panel: 'pt-4',
          }}
          selectedKey={selectedTab as string}
          onSelectionChange={setSelectedTab}
        >
          <Tab key="list" title={t('simulado.tabList')}>
            <SimuladosListTab onCreateNew={() => setSelectedTab('new')} />
          </Tab>
          <Tab key="new" title={t('simulado.tabNew')}>
            <NewSimuladoTab onCreated={() => setSelectedTab('list')} />
          </Tab>
        </Tabs>
      </div>
    </PageHeader>
  );
}

export default function SimuladosPage() {
  return (
    <CertificationsProvider>
      <PublicExamsProvider>
        <CertSimuladosProvider>
          <MockExamsProvider>
            <SimuladosPageContent />
          </MockExamsProvider>
        </CertSimuladosProvider>
      </PublicExamsProvider>
    </CertificationsProvider>
  );
}
