'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';

import { Certification } from '@/shared/types';
import { updateCertificationMeta } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface EditCertificationModalProps {
  certification: Certification | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (oldKey: string, updated: { label: string; key: string; provider?: string; totalQuestions: number; examDurationMinutes?: number; passingScore?: number }) => void;
}

export function EditCertificationModal({ certification, isOpen, onClose, onSaved }: EditCertificationModalProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [certKey, setCertKey] = useState('');
  const [provider, setProvider] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [examDurationMinutes, setExamDurationMinutes] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (certification) {
      setLabel(certification.label);
      setCertKey(certification.key);
      setProvider(certification.provider ?? '');
      setTotalQuestions(String(certification.totalQuestions));
      setExamDurationMinutes(certification.examDurationMinutes != null ? String(certification.examDurationMinutes) : '');
      setPassingScore(certification.passingScore != null ? String(certification.passingScore) : '');
    }
  }, [certification]);

  const handleSave = async () => {
    if (!certification || !label.trim() || !certKey.trim()) return;
    const totalQuestionsNum = parseInt(totalQuestions, 10);

    if (!totalQuestionsNum || totalQuestionsNum < 1) {
      notify.error(t('toast.validationError'), t('error.totalQuestionsRequired'));
      return;
    }
    setSaving(true);
    try {
      await updateCertificationMeta(certification.key, {
        newLabel: label.trim(),
        newKey: certKey.trim(),
        newProvider: provider || null,
        newTotalQuestions: totalQuestionsNum,
        newExamDurationMinutes: parseInt(examDurationMinutes, 10) || null,
        newPassingScore: parseFloat(passingScore) || null,
      });
      onSaved(certification.key, {
        label: label.trim(),
        key: certKey.trim(),
        provider: provider || undefined,
        totalQuestions: totalQuestionsNum,
        examDurationMinutes: parseInt(examDurationMinutes, 10) || undefined,
        passingScore: parseFloat(passingScore) || undefined,
      });
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: label.trim() }));
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      notify.error(t('toast.error'), msg || t('toast.failedToUpdate', { name: label.trim() }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="text-base font-semibold text-foreground">
          {t('certification.editCertification')}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4 pb-2">
          <Input
            {...inputProperties.input}
            label={t('certification.certificationTitle')}
            placeholder={t('certification.certificationTitlePlaceholder')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Input
            {...inputProperties.input}
            label={t('certification.certificationCode')}
            placeholder={t('certification.certificationCodePlaceholder')}
            value={certKey}
            onChange={(e) => setCertKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Input
            {...inputProperties.input}
            label={t('certification.provider')}
            placeholder={t('certification.providerPlaceholder')}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              isRequired
              {...inputProperties.input}
              label={t('certification.totalQuestions')}
              min={1}
              placeholder="e.g. 65"
              type="number"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Input
              {...inputProperties.input}
              endContent={<span className="text-xs text-default-400 self-center">{t('certification.examDurationUnit')}</span>}
              label={t('certification.examDuration')}
              min={1}
              placeholder="e.g. 130"
              type="number"
              value={examDurationMinutes}
              onChange={(e) => setExamDurationMinutes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Input
              {...inputProperties.input}
              endContent={<span className="text-xs text-default-400 self-center">%</span>}
              label={t('certification.passingScore')}
              max={100}
              min={0}
              placeholder="e.g. 72"
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className={buttonStyles.secondary} variant="bordered" onPress={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className={buttonStyles.primary} isLoading={saving} onPress={handleSave}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
