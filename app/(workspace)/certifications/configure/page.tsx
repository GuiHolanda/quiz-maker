'use client';
import { useState } from 'react';
import type { Key } from '@react-types/shared';
import { Tabs, Tab } from '@heroui/tabs';

import CertificationsProvider from '@/features/providers/certifications.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { CertificationsListTab } from './components/CertificationsListTab';
import { NewCertificationTab } from './components/NewCertificationTab';


export default function ConfigureCertificationPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('new');

  return (
    <CertificationsProvider>
    <PageHeader title={t('certification.pageTitle')} subtitle={t('certification.pageSubtitle')} maxWidth="7xl">
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
            <Tab key="new" title={t('certification.tabNew')}>
              <NewCertificationTab onBackToLibrary={() => setSelectedTab('certificationsList')} />
            </Tab>
            <Tab key="certificationsList" title={t('certification.tabList')}>
              <CertificationsListTab />
            </Tab>
          </Tabs>
        </div>
      </PageHeader>
    </CertificationsProvider>
  );
}
