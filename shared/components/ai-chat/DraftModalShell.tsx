'use client';
import type { ReactNode } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface DraftModalShellProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly name: string;
  readonly subtitle?: ReactNode;
  readonly headerFields: ReactNode;
  readonly children: ReactNode;
  readonly addLabel: string;
  readonly onAddPrimary: () => void;
  readonly isSaving: boolean;
  readonly canSave: boolean;
  readonly hasError: boolean;
  readonly onSave: () => void;
  readonly onRetry: () => void;
}

export function DraftModalShell({
  isOpen,
  onClose,
  name,
  subtitle,
  headerFields,
  children,
  addLabel,
  onAddPrimary,
  isSaving,
  canSave,
  hasError,
  onSave,
  onRetry,
}: DraftModalShellProps) {
  const { t } = useTranslation();

  return (
    <Modal className="p-4" isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-base font-bold text-foreground">{t('chat.draftReviewTitle')}</p>
          {name && <p className="text-xs text-default-400 font-normal">{name}</p>}
          {subtitle && <p className="text-xs text-default-400 font-normal">{subtitle}</p>}
        </ModalHeader>

        <ModalBody className="gap-6">
          {hasError && (
            <InlineAlert
              color="danger"
              description={t('chat.errorGenericDescription')}
              endContent={
                <Button className={`${buttonStyles.dangerFlat} text-xs h-7 px-3 shrink-0`} size="sm" onPress={onRetry}>
                  {t('common.retry')}
                </Button>
              }
              title={t('chat.errorGeneric')}
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
              {isSaving ? t('chat.saving') : t('common.save')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
