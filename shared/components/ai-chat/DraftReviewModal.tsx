'use client';
import { Certification, PublicExam } from '@/shared/types';
import { CertificationModal } from '@/shared/components/ai-chat/CertificationModal';
import { ExamModal } from '@/shared/components/ai-chat/ExamModal';

type DraftReviewModalProps =
  | {
      readonly type: 'certification';
      readonly data: Certification;
      readonly isOpen: boolean;
      readonly onClose: () => void;
      readonly onSaved: (saved: Certification) => void;
    }
  | {
      readonly type: 'public-exam';
      readonly data: PublicExam;
      readonly isOpen: boolean;
      readonly onClose: () => void;
      readonly onSaved: (saved: PublicExam) => void;
    };

export function DraftReviewModal(props: DraftReviewModalProps) {
  if (props.type === 'certification') {
    return (
      <CertificationModal data={props.data} isOpen={props.isOpen} onClose={props.onClose} onSaved={props.onSaved} />
    );
  }
  return <ExamModal data={props.data} isOpen={props.isOpen} onClose={props.onClose} onSaved={props.onSaved} />;
}
