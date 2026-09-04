'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';

import { IconBadge } from '@/shared/components/ui/IconBadge';
import { cancelSubscription } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';

const REASON_KEYS = ['passed', 'price', 'usage', 'quality', 'other'] as const;

interface CancelSubscriptionPanelProps {
  readonly planLabel: string;
  readonly accessUntilNote: string;
  readonly freeQuestionsLimit: string;
  readonly onCanceled: () => void;
}

export function CancelSubscriptionPanel({
  planLabel,
  accessUntilNote,
  freeQuestionsLimit,
  onCanceled,
}: CancelSubscriptionPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const losses = [
    t('billing.cancel.loss1', { limit: freeQuestionsLimit }),
    t('billing.cancel.loss2'),
    t('billing.cancel.loss3'),
  ];

  async function handleConfirm() {
    setIsBusy(true);
    try {
      await cancelSubscription(reason || undefined);
      notify.success(t('billing.cancel.doneTitle'), t('billing.cancel.doneDescription'));
      setIsOpen(false);
      onCanceled();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong');

      notify.error(t('toast.error'), message);
      setIsBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default-200 bg-content1 px-6 py-4 dark:border-transparent">
        <div>
          <p className="text-sm font-semibold text-foreground">{t('billing.cancel.rowTitle')}</p>
          <p className="mt-1 max-w-2xl text-[13px] text-default-500 text-pretty">{accessUntilNote}</p>
        </div>
        <Button className={buttonStyles.dangerFlat} onPress={() => setIsOpen(true)}>
          {t('billing.cancel.rowTitle')}
        </Button>
      </div>

      <Modal isOpen={isOpen} size="lg" onClose={() => !isBusy && setIsOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex items-start gap-3 border-b border-divider">
            <IconBadge icon={faTriangleExclamation} tone="danger" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground">{t('billing.cancel.modalTitle', { plan: planLabel })}</p>
              <p className="mt-1 text-sm font-normal leading-relaxed text-default-500 text-pretty">{accessUntilNote}</p>
            </div>
          </ModalHeader>
          <ModalBody className="py-5">
            <div className="flex flex-col gap-2.5 rounded-xl border border-divider bg-background p-4">
              {losses.map((loss) => (
                <div key={loss} className="flex items-start gap-2.5 text-[13px] leading-snug text-default-500">
                  <FontAwesomeIcon className="mt-0.5 h-3 w-3 shrink-0 text-danger" icon={faXmark} />
                  <span>{loss}</span>
                </div>
              ))}
            </div>
            <Select
              className="mt-4"
              label={t('billing.cancel.reasonLabel')}
              placeholder={t('billing.cancel.reasonPlaceholder')}
              selectedKeys={reason ? [reason] : []}
              onSelectionChange={(keys) => setReason(String(Array.from(keys)[0] ?? ''))}
              {...inputProperties.select}
            >
              {REASON_KEYS.map((key) => (
                <SelectItem key={key}>{t(`billing.cancel.reason.${key}`)}</SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter className="border-t border-divider">
            <Button
              className={buttonStyles.secondary}
              isDisabled={isBusy}
              variant="bordered"
              onPress={() => setIsOpen(false)}
            >
              {t('billing.cancel.keep')}
            </Button>
            <Button className={buttonStyles.danger} isLoading={isBusy} onPress={handleConfirm}>
              {t('billing.cancel.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
