'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';

import { Certification } from '@/shared/types';
import { updateCertificationMeta } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';

interface EditCertificationModalProps {
  certification: Certification | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (oldKey: string, updated: { label: string; key: string; provider?: string }) => void;
}

const PROVIDERS = ['providerAws', 'providerMicrosoft', 'providerGoogle', 'providerComptia', 'providerCisco'] as const;
const PROVIDER_VALUES = ['AWS', 'Microsoft', 'Google Cloud', 'CompTIA', 'Cisco'] as const;

export function EditCertificationModal({ certification, isOpen, onClose, onSaved }: EditCertificationModalProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [certKey, setCertKey] = useState('');
  const [provider, setProvider] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (certification) {
      setLabel(certification.label);
      setCertKey(certification.key);
      setProvider(certification.provider ?? '');
    }
  }, [certification]);

  const handleSave = async () => {
    if (!certification || !label.trim() || !certKey.trim()) return;
    setSaving(true);
    try {
      await updateCertificationMeta(certification.key, {
        newLabel: label.trim(),
        newKey: certKey.trim(),
        newProvider: provider || null,
      });
      onSaved(certification.key, { label: label.trim(), key: certKey.trim(), provider: provider || undefined });
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: label.trim() }));
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;

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
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Input
            {...inputProperties.input}
            label={t('certification.certificationCode')}
            value={certKey}
            onChange={(e) => setCertKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Select
            {...inputProperties.select}
            label={t('certification.provider')}
            placeholder={t('certification.providerPlaceholder')}
            selectedKeys={provider ? new Set([provider]) : new Set()}
            onSelectionChange={(keys) => setProvider((Array.from(keys)[0] as string) ?? '')}
          >
            {PROVIDER_VALUES.map((val, i) => (
              <SelectItem key={val}>{t(`certification.${PROVIDERS[i]}`)}</SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button
            className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200"
            variant="bordered"
            onPress={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            isLoading={saving}
            onPress={handleSave}
          >
            {t('common.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
