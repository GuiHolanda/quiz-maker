'use client';
import { Certification, PublicExam } from '@/shared/types';
import { CertificationModal } from '@/shared/components/ai-chat/CertificationModal';
import { ExamModal } from '@/shared/components/ai-chat/ExamModal';

type DraftReviewModalProps = {
  readonly type: 'certification' | 'public-exam';
  readonly data: Certification | PublicExam;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (saved: Certification | PublicExam) => void;
};

export function DraftReviewModal(props: DraftReviewModalProps) {
  const { type, data, isOpen, onClose, onSaved } = props;
  if (type === 'certification') {
    return <CertificationModal data={data as Certification} isOpen={isOpen} onClose={onClose} onSaved={onSaved} />;
  }
  return <ExamModal data={data as PublicExam} isOpen={isOpen} onClose={onClose} onSaved={onSaved} />;
}
