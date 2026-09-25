'use client';

import { Modal, ModalContent } from '@heroui/modal';

import type { QuestionReportReason } from '@/config/constants';
import { ReportQuestionForm } from '@/shared/components/ui/ReportQuestionForm';

interface ReportQuestionModalProps {
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly onSubmit: (reason: QuestionReportReason, comment: string) => void;
  readonly onClose: () => void;
}

export function ReportQuestionModal({ isOpen, isLoading, onSubmit, onClose }: ReportQuestionModalProps) {
  return (
    <Modal isOpen={isOpen} size="lg" onClose={() => !isLoading && onClose()}>
      <ModalContent>
        <ReportQuestionForm isLoading={isLoading} onClose={onClose} onSubmit={onSubmit} />
      </ModalContent>
    </Modal>
  );
}
