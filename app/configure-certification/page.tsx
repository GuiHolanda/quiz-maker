'use client';
import { Tabs, Tab } from '@heroui/tabs';

import CertificationsProvider from '@/features/providers/certifications.provider';
import { CertificationsListTab } from './components/CertificationsListTab';
import { EditCertificationTab } from './components/EditCertificationTab';
import { NewCertificationTab } from './components/NewCertificationTab';


export default function ConfigureCertificationPage() {

  return (
    <CertificationsProvider>
    <div className="app-bg">
      <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
        <div className="flex flex-col mb-8 gap-1.5">
          <h1 className="page-header-title">Your certifications</h1>
          <p className="page-header-subtitle">
            Define the certifications you&apos;re preparing for, configure their topic weights, and AIQuiz will generate quizzes that mirror the real exam distribution.
          </p>
        </div>

        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Options"
            classNames={{
              tabList: 'bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1 gap-1',
              tab: 'rounded-xl text-white/40 data-[selected=true]:text-white/90 data-[selected=true]:font-semibold transition-all duration-200',
              tabContent: 'group-data-[selected=true]:text-white/90',
              cursor: 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 shadow-[0_2px_8px_rgba(139,92,246,0.4)] rounded-xl',
              panel: 'pt-4',
            }}
          >
            <Tab key="new" title="Add new Certification">
              <NewCertificationTab />
            </Tab>
            <Tab key="certificationsList" title="My certifications">
              <CertificationsListTab />
            </Tab>
            <Tab key="edit" title="Edit Certification">
              <EditCertificationTab />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
    </CertificationsProvider>
  );
}
