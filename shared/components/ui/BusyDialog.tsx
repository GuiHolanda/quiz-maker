'use client';

import { Modal, ModalContent, ModalBody } from '@heroui/modal';
import { Spinner } from '@heroui/spinner';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface BusyDialogProps {
  isOpen: boolean;
}

export function BusyDialog({ isOpen }: Readonly<BusyDialogProps>) {
  const { t } = useTranslation();

  return (
    <Modal hideCloseButton isDismissable={false} isOpen={isOpen}>
      <ModalContent>
        <ModalBody className="flex flex-col items-center justify-center py-8">
          <Spinner color="primary" label={t('busy.generating')} size="lg" />
          <span className="mt-4 text-default-500">{t('busy.pleaseWait')}</span>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
