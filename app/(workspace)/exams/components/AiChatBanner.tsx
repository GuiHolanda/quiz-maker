'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAiChatUI } from '@/features/hooks/useAiChatUI.hook';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface AiChatBannerProps {
  readonly hasAiChat: boolean;
}

export function AiChatBanner({ hasAiChat }: AiChatBannerProps) {
  const { t } = useTranslation();
  const { openChat } = useAiChatUI();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  function handlePress() {
    if (hasAiChat) {
      openChat();
    } else {
      setIsUpgradeOpen(true);
    }
  }

  return (
    <>
      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon className="text-secondary" icon={faRobot} size="lg" />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t('exam.aiChatCard.title')}</h2>
          <p className="text-sm text-default-500">{t('exam.aiChatCard.description')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!hasAiChat && (
            <Chip color="secondary" size="sm" variant="flat">
              PRO AI
            </Chip>
          )}
          <Button className={buttonStyles.secondary} variant="bordered" onPress={handlePress}>
            {t('exam.aiChatCard.cta')}
          </Button>
        </div>
      </div>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );
}
