'use client';

import { useState, useCallback } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditCertificationModal } from './EditCertificationModal';

import { SectionsTable } from '@/shared/components/SectionsTable';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { deleteCertification } from '@/features/connectors';
import { Certification, CertificationTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

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
        <EmptyState
          action={{
            label: t('certification.tabNew'),
            onPress: onCreateNew,
          }}
          description={t('certification.noCertificationsDescription')}
          title={t('certification.noCertificationsTitle')}
        />
      ) : (
        <Accordion
          className="mt-2 flex flex-col gap-2 px-0"
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl',
            title: 'text-sm font-bold text-foreground',
            titleWrapper: 'flex-1 flex flex-col text-start min-w-0 overflow-hidden',
            trigger: 'px-6 py-4 hover:bg-content2 rounded-xl transition-colors duration-200',
            content: 'px-6 pb-6',
            indicator: 'text-default-400',
          }}
          showDivider={false}
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
                    <span className="text-xs text-default-500 shrink-0 max-w-[160px] truncate">
                      {certification.provider}
                    </span>
                  )}
                  {certification.topics.length === 0 ? (
                    <Chip color="warning" size="sm" variant="flat">
                      {t('certification.noTopics')}
                    </Chip>
                  ) : (
                    <span className="text-xs font-mono text-default-400 shrink-0">
                      {certification.topics.length === 1
                        ? t('certification.topicCount1')
                        : t('certification.topicCountN', { count: String(certification.topics.length) })}
                    </span>
                  )}
                </div>
              }
            >
              <div className="flex items-center justify-end gap-2 pt-1 pb-4 mb-4 border-b border-default-200">
                <Button
                  className={buttonStyles.flat}
                  size="sm"
                  startContent={<FontAwesomeIcon className="text-xs" icon={faPen} />}
                  onPress={() => setEditingCert(certification)}
                >
                  {t('certification.editCertification')}
                </Button>
                <Button
                  className={buttonStyles.dangerFlat}
                  size="sm"
                  startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
                  onPress={() => setDeletingCert(certification)}
                >
                  {t('certification.deleteCertificationTitle')}
                </Button>
              </div>
              <SectionsTable
                selectedCertification={certification}
                topicsList={certification.topics}
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
              className={buttonStyles.secondary}
              isDisabled={isDeleting}
              variant="bordered"
              onPress={() => setDeletingCert(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button className={buttonStyles.danger} isLoading={isDeleting} onPress={handleDeleteConfirm}>
              {t('common.remove')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
