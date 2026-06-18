'use client';

import { useState, useCallback } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

import { EditCertificationModal } from './EditCertificationModal';

import { SectionsTable } from '@/shared/components/SectionsTable';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { deleteCertification } from '@/features/connectors';
import { Certification, CertificationTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

interface CertificationsListTabProps {
  readonly onCreateNew: () => void;
}

export function CertificationsListTab({ onCreateNew }: CertificationsListTabProps) {
  const { t } = useTranslation();
  const { certifications, isLoading, updateCertification, removeCertification } = useCertificationsContext();
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [deletingCert, setDeletingCert] = useState<Certification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCert?.key) return;
    setIsDeleting(true);
    try {
      await deleteCertification(deletingCert.key);
      removeCertification(deletingCert.key);
      notify.success(t('toast.success'), t('certification.certificationDeleted', { name: deletingCert.label }));
      setDeletingCert(null);
    } catch {
      notify.error(t('toast.error'), t('certification.certificationDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingCert, removeCertification, t]);

  if (isLoading) {
    return <SkeletonListLoader />;
  }

  return (
    <>
      {certifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 bg-content1 border border-default-200 rounded-xl text-center">
          <p className="text-base font-semibold text-foreground">{t('certification.noCertificationsTitle')}</p>
          <p className="text-sm text-default-500 max-w-sm">{t('certification.noCertificationsDescription')}</p>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 mt-2"
            startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faPlus} />}
            onPress={onCreateNew}
          >
            {t('certification.tabNew')}
          </Button>
        </div>
      ) : (
        <Accordion
          className="mt-2 flex flex-col gap-2 px-0"
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl',
            title: 'text-sm text-foreground font-semibold',
            titleWrapper: 'flex-1 flex flex-col text-start min-w-0 overflow-hidden',
            trigger: 'px-4 py-3 hover:bg-default-100 rounded-xl transition-colors duration-200',
            content: 'px-4 pb-4',
            indicator: 'text-default-400',
          }}
        >
          {certifications.map((certification) => (
            <AccordionItem
              key={certification.key}
              aria-label={certification.label}
              title={
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
                    {certification.label}
                  </span>
                  {certification.provider && (
                    <>
                      <span className="text-xs text-default-400 shrink-0">·</span>
                      <span className="text-xs text-default-500 shrink-0">{certification.provider}</span>
                    </>
                  )}
                  <span
                    aria-label={t('common.remove')}
                    className="ml-auto shrink-0 p-1.5 rounded-lg text-default-400 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCert(certification);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setDeletingCert(certification);
                      }
                    }}
                  >
                    <FontAwesomeIcon className="w-3 h-3" icon={faTrash} />
                  </span>
                </div>
              }
            >
              <SectionsTable
                selectedCertification={certification}
                topicsList={certification.topics}
                onEditCertification={() => setEditingCert(certification)}
                onTopicAdded={(topic) => handleTopicAdded(certification, topic)}
                onTopicRemoved={(topicId) => handleTopicRemoved(certification, topicId)}
                onTopicUpdated={(topicId, newName, min, max) =>
                  handleTopicUpdated(certification, topicId, newName, min, max)
                }
              />
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <EditCertificationModal
        certification={editingCert}
        isOpen={editingCert !== null}
        onClose={() => setEditingCert(null)}
        onSaved={handleCertSaved}
      />

      <Modal isOpen={deletingCert !== null} size="sm" onClose={() => !isDeleting && setDeletingCert(null)}>
        <ModalContent>
          <ModalHeader>{t('certification.deleteCertificationTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              {t('certification.deleteCertificationConfirm', { name: deletingCert?.label ?? '' })}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              className="border border-default-200 text-default-600"
              isDisabled={isDeleting}
              variant="flat"
              onPress={() => setDeletingCert(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button color="danger" isLoading={isDeleting} onPress={handleDeleteConfirm}>
              {t('common.remove')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
