'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

import type { LimitError } from '@/lib/limit-error';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { getCheckoutUrl } from '@/features/connectors';

interface LimitReachedModalProps {
  readonly limit: LimitError | null;
  readonly onClose: () => void;
}

// i18n keys per limit. Every entry names what was hit and what the upgrade buys, so the
// user never sees a bare "something went wrong" for a block that is entirely expected.
const COPY: Record<LimitError['code'], { title: string; body: string }> = {
  exam_limit: { title: 'limit.examTitle', body: 'limit.examBody' },
  questions_limit: { title: 'limit.questionsTitle', body: 'limit.questionsBody' },
  auto_config_limit: { title: 'limit.autoConfigTitle', body: 'limit.autoConfigBody' },
  plan_required: { title: 'limit.planTitle', body: 'limit.planBody' },
};

// A free user hitting any wall upgrades to pro; a pro user who ran out of auto-config
// (the only limit pro_ai actually raises) is the one case where pro_ai is the answer.
function targetProduct(limit: LimitError): 'pro' | 'pro_ai' {
  return limit.plan === 'pro' && limit.code === 'auto_config_limit' ? 'pro_ai' : 'pro';
}

export function LimitReachedModal({ limit, onClose }: LimitReachedModalProps) {
  const { t } = useTranslation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!limit) return null;

  const copy = COPY[limit.code];
  const product = targetProduct(limit);

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      window.location.href = await getCheckoutUrl('monthly', product);
    } catch {
      setIsRedirecting(false);
    }
  };

  return (
    <Modal isOpen={limit !== null} size="sm" onClose={() => !isRedirecting && onClose()}>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-base font-semibold text-foreground border-b border-default-200">
          <FontAwesomeIcon className="text-warning" icon={faCircleExclamation} />
          {t(copy.title)}
        </ModalHeader>
        <ModalBody className="py-6 flex flex-col gap-4">
          <p className="text-sm text-default-500">{t(copy.body)}</p>

          {limit.limit != null && (
            <div className="flex items-center justify-between bg-content2 border border-default-200 rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-default-500">{t('limit.currentUsage')}</span>
              <span className="text-sm font-bold text-foreground">
                {t('limit.usageValue', { used: String(limit.used ?? limit.limit), limit: String(limit.limit) })}
              </span>
            </div>
          )}

          <p className="text-xs text-default-400">
            {t(product === 'pro_ai' ? 'limit.upgradeHintProAi' : 'limit.upgradeHintPro')}
          </p>
        </ModalBody>
        <ModalFooter className="border-t border-default-200">
          <Button
            className={buttonStyles.secondary}
            isDisabled={isRedirecting}
            size="sm"
            variant="bordered"
            onPress={onClose}
          >
            {t('common.close')}
          </Button>
          <Button
            className={buttonStyles.primary}
            data-testid="limit-upgrade-btn"
            isLoading={isRedirecting}
            size="sm"
            startContent={isRedirecting ? undefined : <FontAwesomeIcon className="text-xs" icon={faArrowUp} />}
            onPress={handleUpgrade}
          >
            {t('billing.upgradeModal.cta')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
