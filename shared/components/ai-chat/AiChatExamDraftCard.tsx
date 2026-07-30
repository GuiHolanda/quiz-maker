'use client';
import { useState } from 'react';

import { PublicExam } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { AiChatDraftCard } from '@/shared/components/ai-chat/AiChatDraftCard';
import { DraftReviewModal } from '@/shared/components/ai-chat/DraftReviewModal';

interface AiChatExamDraftCardProps {
  readonly publicExam: PublicExam;
  readonly onExamSaved?: () => void;
}

export function AiChatExamDraftCard({ publicExam, onExamSaved }: AiChatExamDraftCardProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedDraft, setSavedDraft] = useState<PublicExam | null>(null);

  const isSaved = savedDraft !== null;
  const displayExam = savedDraft ?? publicExam;

  const meta = [displayExam.examBoard.name, displayExam.role, displayExam.year?.toString()].filter(Boolean).join(' · ');
  const count = `${displayExam.subjects.length} ${t('chat.subjects')}`;

  return (
    <AiChatDraftCard
      badge={t('chat.examFound')}
      count={count}
      isSaved={isSaved}
      meta={meta}
      modal={
        <DraftReviewModal
          type="public-exam"
          data={publicExam}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={(draft) => {
            setSavedDraft(draft as PublicExam);
            setIsModalOpen(false);
            onExamSaved?.();
          }}
        />
      }
      title={displayExam.name}
      onReviewPress={() => setIsModalOpen(true)}
    />
  );
}
