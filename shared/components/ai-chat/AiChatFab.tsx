'use client';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface AiChatFabProps {
  readonly onPress: () => void;
}

export function AiChatFab({ onPress }: AiChatFabProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        isIconOnly
        aria-label={t('chat.openAssistant')}
        className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200"
        radius="full"
        size="lg"
        onPress={onPress}
      >
        <FontAwesomeIcon className="w-5 h-5" icon={faComments} />
      </Button>
    </div>
  );
}
