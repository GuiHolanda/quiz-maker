'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Button } from '@heroui/button';

import { ExamTypePicker } from '@/shared/components/ui/ExamTypePicker';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { ExamType } from '@/shared/types';

interface ExamTypePickerModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (type: ExamType) => void;
}

export function ExamTypePickerModal({ isOpen, onClose, onConfirm }: ExamTypePickerModalProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<ExamType>('certification');

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="border-b border-default-200 dark:border-transparent">
          {t('exam.typePickerModalTitle')}
        </ModalHeader>
        <ModalBody className="py-6">
          <ExamTypePicker
            certification={{ title: t('nav.certifications'), body: t('certification.pageSubtitle') }}
            publicExam={{ title: t('nav.publicExams'), body: t('concurso.pageSubtitle') }}
            value={type}
            onChange={setType}
          />
        </ModalBody>
        <ModalFooter className="border-t border-default-200 dark:border-transparent">
          <Button className={buttonStyles.secondary} variant="bordered" onPress={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className={buttonStyles.primary} onPress={() => onConfirm(type)}>
            {t('common.continue')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
