'use client';

import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface BusyDialogProps {
  isOpen: boolean;
}

export function BusyDialog({ isOpen }: Readonly<BusyDialogProps>) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} isDismissable={false} hideCloseButton>
      <ModalContent>
        <ModalBody className="flex flex-col items-center justify-center py-8">
          <Spinner size="lg" color="primary" label={t('busy.generating')} />
          <span className="mt-4 text-default-500">{t('busy.pleaseWait')}</span>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}