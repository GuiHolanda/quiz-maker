'use client';
import { ReactNode } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface DraftReviewModalError {
  readonly title: string;
  readonly description?: string;
  readonly onRetry: () => void;
}

interface DraftReviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: ReactNode;
  readonly headerFields: ReactNode;
  readonly children: ReactNode;
  readonly addLabel: string;
  readonly onAddPrimary: () => void;
  readonly saveLabel: string;
  readonly isSaving: boolean;
  readonly canSave: boolean;
  readonly error?: DraftReviewModalError | null;
  readonly onSave: () => void;
}

export function DraftReviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerFields,
  children,
  addLabel,
  onAddPrimary,
  saveLabel,
  isSaving,
  canSave,
  error,
  onSave,
}: DraftReviewModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose} className="p-4">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-base font-bold text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-default-400 font-normal">{subtitle}</p>}
        </ModalHeader>

        <ModalBody className="gap-6">
          {error && (
            <InlineAlert
              color="danger"
              description={error.description}
              endContent={
                <Button
                  className={`${buttonStyles.dangerFlat} text-xs h-7 px-3 shrink-0`}
                  size="sm"
                  onPress={error.onRetry}
                >
                  {t('common.retry')}
                </Button>
              }
              title={error.title}
            />
          )}
          {headerFields}
          {children}
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full">
            <Button
              className={`${buttonStyles.flat} text-xs`}
              isDisabled={isSaving}
              size="sm"
              startContent={<FontAwesomeIcon className="w-3 h-3" icon={faPlus} />}
              onPress={onAddPrimary}
            >
              {addLabel}
            </Button>
            <Button
              className={buttonStyles.primarySm}
              isDisabled={isSaving || !canSave}
              size="sm"
              startContent={isSaving ? <Spinner color="current" size="sm" /> : undefined}
              onPress={onSave}
            >
              {saveLabel}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
