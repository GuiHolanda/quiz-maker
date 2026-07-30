'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Button } from '@heroui/button';

import { Exam, Provider } from '@/shared/types';
import { updateExamMeta, getProviders } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface EditCertificationModalProps {
  readonly certification: Exam | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (
    id: string,
    updated: {
      name: string;
      provider?: Provider | null;
      totalQuestions: number;
      examDurationMinutes?: number;
      passingScore?: number;
    }
  ) => void;
}

export function EditCertificationModal({ certification, isOpen, onClose, onSaved }: EditCertificationModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [examDurationMinutes, setExamDurationMinutes] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (certification) {
      setName(certification.name);
      setProvider(certification.provider?.name ?? '');
      setTotalQuestions(String(certification.totalQuestions));
      setExamDurationMinutes(certification.examDurationMinutes != null ? String(certification.examDurationMinutes) : '');
      setPassingScore(certification.passingScore != null ? String(certification.passingScore) : '');
    }
  }, [certification]);

  useEffect(() => {
    if (isOpen)
      getProviders()
        .then(setProviders)
        .catch(() => {});
  }, [isOpen]);

  const handleSave = async () => {
    if (!certification?.id || !name.trim()) return;
    const totalQuestionsNum = parseInt(totalQuestions, 10);

    if (!totalQuestionsNum || totalQuestionsNum < 1) {
      notify.error(t('toast.validationError'), t('error.totalQuestionsRequired'));
      return;
    }
    setSaving(true);
    try {
      await updateExamMeta(certification.id, {
        newName: name.trim(),
        newProviderName: provider.trim() || null,
        newTotalQuestions: totalQuestionsNum,
        newExamDurationMinutes: parseInt(examDurationMinutes, 10) || null,
        newPassingScore: parseFloat(passingScore) || null,
      });
      onSaved(certification.id, {
        name: name.trim(),
        provider: provider.trim() ? { name: provider.trim() } : null,
        totalQuestions: totalQuestionsNum,
        examDurationMinutes: parseInt(examDurationMinutes, 10) || undefined,
        passingScore: parseFloat(passingScore) || undefined,
      });
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name.trim() }));
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      notify.error(t('toast.error'), msg || t('toast.failedToUpdate', { name: name.trim() }));
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Autocomplete
            allowsCustomValue
            inputValue={provider}
            label={t('exam.providerLabel')}
            placeholder={t('certification.providerPlaceholder')}
            onInputChange={setProvider}
            {...inputProperties.autocomplete}
          >
            {providers.map((p) => (
              <AutocompleteItem key={p.name}>{p.name}</AutocompleteItem>
            ))}
          </Autocomplete>
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
