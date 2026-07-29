'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { PublicExam } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { ExamDraftReviewModal } from '@/shared/components/ui/ExamDraftReviewModal';

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

  return (
    <div className="bg-content1 border-2 border-primary rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">{t('chat.examFound')}</span>
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
        <p className="font-semibold leading-snug">{displayExam.name}</p>
        <p className="text-default-500 text-xs">
          {displayExam.examBoard.name}
          {displayExam.role ? ` · ${displayExam.role}` : ''}
          {displayExam.year ? ` · ${displayExam.year}` : ''}
        </p>
        <p className="text-xs text-default-400">
          {displayExam.subjects.length} {t('chat.subjects')}
        </p>
      </div>

      {!isSaved && (
        <Button
          className="bg-primary/10 text-primary hover:bg-primary/20 font-semibold rounded-lg text-xs"
          endContent={<FontAwesomeIcon className="w-3 h-3" icon={faArrowRight} />}
          size="sm"
          variant="flat"
          onPress={() => setIsModalOpen(true)}
        >
          {t('chat.reviewEdit')}
        </Button>
      )}

      <ExamDraftReviewModal
        isOpen={isModalOpen}
        publicExam={publicExam}
        onClose={() => setIsModalOpen(false)}
        onSaved={(draft) => {
          setSavedDraft(draft);
          setIsModalOpen(false);
          onExamSaved?.();
        }}
      />
    </div>
  );
}
