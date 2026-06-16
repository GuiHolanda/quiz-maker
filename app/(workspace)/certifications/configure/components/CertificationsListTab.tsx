'use client';

import { useState, useCallback } from 'react';
import { Accordion, AccordionItem } from "@heroui/accordion";

import { SectionsTable } from "@/shared/components/SectionsTable";
import useCertificationsContext from "@/features/hooks/useCertificationsContext.hook";
import { Certification, CertificationTopic } from "@/shared/types";
import { EditCertificationModal } from './EditCertificationModal';

export function CertificationsListTab() {
  const { certifications, updateCertification } = useCertificationsContext();
  const [editingCert, setEditingCert] = useState<Certification | null>(null);

  const handleTopicUpdated = useCallback(
    (certification: Certification, topicId: string, newName: string, minQuestions: number, maxQuestions: number) => {
      const updatedTopics = certification.topics.map((t) =>
        t.id === topicId ? { ...t, name: newName, minQuestions, maxQuestions } : t
      );
      updateCertification(certification.key, { topics: updatedTopics });
    },
    [updateCertification]
  );

  const handleTopicRemoved = useCallback(
    (certification: Certification, topicId: string) => {
      const updatedTopics = certification.topics.filter((t) => t.id !== topicId);
      updateCertification(certification.key, { topics: updatedTopics });
    },
    [updateCertification]
  );

  const handleTopicAdded = useCallback(
    (certification: Certification, topic: CertificationTopic) => {
      updateCertification(certification.key, { topics: [...certification.topics, topic] });
    },
    [updateCertification]
  );

  const handleCertSaved = useCallback(
    (oldKey: string, updated: { label: string; key: string; provider?: string }) => {
      updateCertification(oldKey, { label: updated.label, key: updated.key, provider: updated.provider });
    },
    [updateCertification]
  );

  return (
    <>
      <Accordion
        className="mt-2 flex flex-col gap-2 px-0"
        itemClasses={{
          base: 'bg-content1 border border-default-200 rounded-xl',
          title: 'text-sm text-foreground font-semibold',
          trigger: 'px-4 py-3 hover:bg-default-100 rounded-xl transition-colors duration-200',
          content: 'px-4 pb-4',
          indicator: 'text-default-400',
        }}
      >
        {certifications.map((certification) => (
          <AccordionItem
            key={certification.key}
            aria-label={certification.label}
            title={certification.label}
          >
            <SectionsTable
              selectedCertification={certification}
              topicsList={certification.topics}
              onTopicUpdated={(topicId, newName, min, max) => handleTopicUpdated(certification, topicId, newName, min, max)}
              onTopicRemoved={(topicId) => handleTopicRemoved(certification, topicId)}
              onTopicAdded={(topic) => handleTopicAdded(certification, topic)}
              onEditCertification={() => setEditingCert(certification)}
            />
          </AccordionItem>
        ))}
      </Accordion>

      <EditCertificationModal
        certification={editingCert}
        isOpen={editingCert !== null}
        onClose={() => setEditingCert(null)}
        onSaved={handleCertSaved}
      />
    </>
  );
}
