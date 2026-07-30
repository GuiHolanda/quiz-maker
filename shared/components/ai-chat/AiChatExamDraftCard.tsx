'use client';
import { useState } from 'react';

import { Exam } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { AiChatDraftCard } from '@/shared/components/ai-chat/AiChatDraftCard';
import { ExamModal } from '@/shared/components/ai-chat/ExamModal';

interface AiChatExamDraftCardProps {
  readonly exam: Exam;
  readonly onExamSaved?: () => void;
}

export function AiChatExamDraftCard({ exam, onExamSaved }: AiChatExamDraftCardProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedDraft, setSavedDraft] = useState<Exam | null>(null);

  const isSaved = savedDraft !== null;
  const display = savedDraft ?? exam;
  const isCertification = display.type === 'certification';

  const referenceName = isCertification ? display.provider?.name : display.examBoard?.name;
  const meta = [referenceName, display.role, display.year?.toString()].filter(Boolean).join(' · ');
  const count = `${display.sections.length} ${t('exam.sections')}`;
  const badge = isCertification ? t('exam.certificationPreview') : t('exam.examFound');

  return (
    <AiChatDraftCard
      badge={badge}
      count={count}
      isSaved={isSaved}
      meta={meta}
      modal={
        <ExamModal
          data={exam}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={(saved) => {
            setSavedDraft(saved);
            setIsModalOpen(false);
            onExamSaved?.();
          }}
        />
      }
      title={display.name}
      onReviewPress={() => setIsModalOpen(true)}
    />
  );
}
