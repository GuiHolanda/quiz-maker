'use client';

import { Modal, ModalContent } from '@heroui/modal';

import type { FeedbackCategory } from '@/config/constants';
import { FeedbackForm } from '@/shared/components/ui/FeedbackForm';

interface FeedbackModalProps {
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly onSubmit: (category: FeedbackCategory, message: string) => void;
  readonly onClose: () => void;
}

export function FeedbackModal({ isOpen, isLoading, onSubmit, onClose }: FeedbackModalProps) {
  return (
    <Modal isOpen={isOpen} size="lg" onClose={() => !isLoading && onClose()}>
      <ModalContent>
        <FeedbackForm isLoading={isLoading} onClose={onClose} onSubmit={onSubmit} />
      </ModalContent>
    </Modal>
  );
}
