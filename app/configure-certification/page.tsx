'use client';
import { title } from '@/components/primitives';
import { Tabs, Tab } from '@heroui/tabs';
import { NewCertificationTab } from '@/components/certification-management/NewCertificationTab';
import { CertificationsListTab } from '@/components/certification-management/CertificationsListTab';
import { EditCertificationTab } from '@/components/certification-management/EditCertificationTab';
import CertificationsProvider from '@/features/providers/certifications.provider';

export default function ConfigureCertificationPage() {

  return (
    <CertificationsProvider>
    <div className="container mx-auto max-w-7xl pt-6 px-6">
      <div className="flex flex-col mb-8 gap-2">
        <h1 className={title()}>Manage your Certifications</h1>
        <h3 className="text-lg font-bold text-zinc-400 pl-2">
          Create, edit, and delete your certifications and their associated topics.
        </h3>
      </div>

      <div className="flex w-full flex-col">
        <Tabs aria-label="Options">
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
    </CertificationsProvider>
  );
}
