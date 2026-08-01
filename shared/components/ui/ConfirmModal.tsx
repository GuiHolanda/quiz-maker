'use client';

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ConfirmModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly body: React.ReactNode;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly confirmVariant?: 'danger' | 'dangerFlat' | 'primary';
  readonly isLoading?: boolean;
  readonly confirmTestId?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  body,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  isLoading,
  confirmTestId,
  size = 'sm',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} size={size} onClose={() => !isLoading && onClose()}>
      <ModalContent>
        <ModalHeader className="text-base font-semibold text-foreground border-b border-default-200">
          {title}
        </ModalHeader>
        <ModalBody className="py-6">{body}</ModalBody>
        <ModalFooter className="border-t border-default-200">
          <Button
            className={buttonStyles.secondary}
            isDisabled={isLoading}
            size="sm"
            variant="bordered"
            onPress={onClose}
          >
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            data-testid={confirmTestId}
            className={buttonStyles[confirmVariant]}
            isLoading={isLoading}
            size="sm"
            onPress={onConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
