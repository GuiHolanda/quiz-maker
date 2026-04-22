'use client';
import { Tabs, Tab } from '@heroui/tabs';

import CertificationsProvider from '@/features/providers/certifications.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { CertificationsListTab } from './components/CertificationsListTab';
import { EditCertificationTab } from './components/EditCertificationTab';
import { NewCertificationTab } from './components/NewCertificationTab';


export default function ConfigureCertificationPage() {
  const { t } = useTranslation();

  return (
    <CertificationsProvider>
    <div className="app-bg">
      <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
        <div className="flex flex-col mb-8 gap-1.5">
          <h1 className="page-header-title">{t('certification.pageTitle')}</h1>
          <p className="page-header-subtitle">
            {t('certification.pageSubtitle')}
          </p>
        </div>

        <div className="flex w-full flex-col">
          <Tabs
            aria-label={t('aria.tabOptions')}
            classNames={{
              tabList: 'bg-default-100 border border-default-200 rounded-xl p-1 gap-1',
              tab: 'rounded-xl text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold transition-colors duration-200',
              tabContent: 'group-data-[selected=true]:text-foreground',
              cursor: 'bg-primary rounded-xl',
              panel: 'pt-4',
            }}
          >
            <Tab key="new" title={t('certification.tabNew')}>
              <NewCertificationTab />
            </Tab>
            <Tab key="certificationsList" title={t('certification.tabList')}>
              <CertificationsListTab />
            </Tab>
            <Tab key="edit" title={t('certification.tabEdit')}>
              <EditCertificationTab />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
    </CertificationsProvider>
  );
}
