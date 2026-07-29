'use client';
import { useState } from 'react';

import { Certification } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { AiChatDraftCard } from '@/shared/components/ai-chat/AiChatDraftCard';
import { CertificationDraftReviewModal } from '@/shared/components/ai-chat/CertificationDraftReviewModal';

interface AiChatCertificationDraftCardProps {
  readonly certification: Certification;
  readonly onCertificationSaved?: () => void;
}

export function AiChatCertificationDraftCard({
  certification,
  onCertificationSaved,
}: AiChatCertificationDraftCardProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedDraft, setSavedDraft] = useState<Certification | null>(null);

  const isSaved = savedDraft !== null;
  const display = savedDraft ?? certification;

  const meta = [display.key, display.provider].filter(Boolean).join(' · ');
  const count = `${display.topics.length} ${t('chat.topics')}`;

  return (
    <AiChatDraftCard
      badge={t('chat.certificationPreview')}
      count={count}
      isSaved={isSaved}
      meta={meta}
      modal={
        <CertificationDraftReviewModal
          certification={certification}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={(draft) => {
            setSavedDraft(draft);
            setIsModalOpen(false);
            onCertificationSaved?.();
          }}
        />
      }
      title={display.label}
      onReviewPress={() => setIsModalOpen(true)}
    />
  );
}
