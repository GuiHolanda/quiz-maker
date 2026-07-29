'use client';
import type { ReactNode } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface AiChatDraftCardProps {
  readonly badge: string;
  readonly title: string;
  readonly meta: string;
  readonly count: string;
  readonly isSaved: boolean;
  readonly onReviewPress: () => void;
  readonly modal: ReactNode;
}

export function AiChatDraftCard({ badge, title, meta, count, isSaved, onReviewPress, modal }: AiChatDraftCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 border-2 border-primary rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">{badge}</span>
        {isSaved && (
          <Chip
            color="success"
            size="sm"
            startContent={<FontAwesomeIcon className="w-3 h-3" icon={faCheck} />}
            variant="flat"
          >
            {t('chat.saved')}
          </Chip>
        )}
      </div>

      <div className="space-y-1 text-sm text-foreground mb-3">
        <p className="font-semibold leading-snug">{title}</p>
        <p className="text-default-500 text-xs">{meta}</p>
        <p className="text-xs text-default-400">{count}</p>
      </div>

      {!isSaved && (
        <Button
          className="bg-primary/10 text-primary hover:bg-primary/20 font-semibold rounded-lg text-xs"
          endContent={<FontAwesomeIcon className="w-3 h-3" icon={faArrowRight} />}
          size="sm"
          variant="flat"
          onPress={onReviewPress}
        >
          {t('chat.reviewEdit')}
        </Button>
      )}

      {modal}
    </div>
  );
}
