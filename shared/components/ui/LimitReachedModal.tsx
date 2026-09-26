'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

import { upgradeTargetFor, type LimitError } from '@/shared/lib/limitError';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { getCheckoutUrl, getPortalUrl } from '@/features/connectors';

interface LimitReachedModalProps {
  readonly limit: LimitError | null;
  readonly onClose: () => void;
}

// i18n keys per limit. Every entry names what was hit and what the upgrade buys, so the
// user never sees a bare "something went wrong" for a block that is entirely expected.
const COPY: Record<LimitError['code'], { title: string; body: string; topTierBody: string }> = {
  exam_limit: { title: 'limit.examTitle', body: 'limit.examBody', topTierBody: 'limit.examBodyTopTier' },
  questions_limit: {
    title: 'limit.questionsTitle',
    body: 'limit.questionsBody',
    topTierBody: 'limit.questionsBodyTopTier',
  },
  auto_config_limit: {
    title: 'limit.autoConfigTitle',
    body: 'limit.autoConfigBody',
    topTierBody: 'limit.autoConfigBodyTopTier',
  },
  plan_required: { title: 'limit.planTitle', body: 'limit.planBody', topTierBody: 'limit.planBody' },
};

export function LimitReachedModal({ limit, onClose }: LimitReachedModalProps) {
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!limit) return null;

  const copy = COPY[limit.code];
  const product = upgradeTargetFor(limit.plan);
  const isSubscriber = !!usage?.hasStripePortalAccess && (limit.plan === 'pro' || limit.plan === 'pro_ai');

  const handleUpgrade = async (target: 'pro' | 'pro_ai') => {
    setIsRedirecting(true);
    try {
      window.location.href = isSubscriber ? await getPortalUrl() : await getCheckoutUrl('monthly', target);
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
          <p className="text-sm text-default-500">{t(product ? copy.body : copy.topTierBody)}</p>

          {limit.limit != null && (
            <div className="flex items-center justify-between bg-content2 border border-default-200 rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-default-500">{t('limit.currentUsage')}</span>
              <span className="text-sm font-bold text-foreground">
                {t('limit.usageValue', { used: String(limit.used ?? limit.limit), limit: String(limit.limit) })}
              </span>
            </div>
          )}

          {product && (
            <p className="text-xs text-default-400">
              {t(product === 'pro_ai' ? 'limit.upgradeHintProAi' : 'limit.upgradeHintPro')}
            </p>
          )}
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
          {product && (
            <Button
              className={buttonStyles.primary}
              data-testid="limit-upgrade-btn"
              isLoading={isRedirecting}
              size="sm"
              startContent={isRedirecting ? undefined : <FontAwesomeIcon className="text-xs" icon={faArrowUp} />}
              onPress={() => handleUpgrade(product)}
            >
              {t('billing.upgradeModal.cta')}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
