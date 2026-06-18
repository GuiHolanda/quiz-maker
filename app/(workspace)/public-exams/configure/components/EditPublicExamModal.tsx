'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Button } from '@heroui/button';

import { ExamBoard, PublicExam } from '@/shared/types';
import { updatePublicExamMeta, getExamBoards } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';

interface EditPublicExamModalProps {
  publicExam: PublicExam | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (id: string, updated: { name: string; role?: string; year?: number; examBoard: ExamBoard }) => void;
}

export function EditPublicExamModal({ publicExam, isOpen, onClose, onSaved }: EditPublicExamModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [year, setYear] = useState('');
  const [examBoardName, setExamBoardName] = useState('');
  const [boards, setBoards] = useState<ExamBoard[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (publicExam) {
      setName(publicExam.name);
      setRole(publicExam.role ?? '');
      setYear(publicExam.year != null ? String(publicExam.year) : '');
      setExamBoardName(publicExam.examBoard?.name ?? '');
    }
  }, [publicExam]);

  useEffect(() => {
    if (isOpen)
      getExamBoards()
        .then(setBoards)
        .catch(() => {});
  }, [isOpen]);

  const handleSave = async () => {
    if (!publicExam?.id || !name.trim() || !examBoardName.trim()) return;
    setSaving(true);
    try {
      const yearNum = year ? Number(year) : null;

      await updatePublicExamMeta(publicExam.id, {
        newName: name.trim(),
        newRole: role.trim() || null,
        newYear: yearNum,
        newExamBoardName: examBoardName.trim(),
      });
      onSaved(publicExam.id, {
        name: name.trim(),
        role: role.trim() || undefined,
        year: yearNum ?? undefined,
        examBoard: { name: examBoardName.trim() },
      });
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name.trim() }));
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;

      notify.error(t('toast.error'), msg || t('toast.failedToUpdate', { name: name.trim() }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="text-base font-semibold text-foreground">{t('concurso.editPublicExam')}</ModalHeader>
        <ModalBody className="flex flex-col gap-4 pb-2">
          <Input
            {...inputProperties.input}
            label={t('concurso.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Autocomplete
            allowsCustomValue
            inputValue={examBoardName}
            label={t('concurso.banca')}
            placeholder={t('concurso.bancaPlaceholder')}
            onInputChange={setExamBoardName}
            {...inputProperties.autocomplete}
          >
            {boards.map((b) => (
              <AutocompleteItem key={b.name}>{b.name}</AutocompleteItem>
            ))}
          </Autocomplete>
          <Input
            {...inputProperties.input}
            label={t('concurso.cargo')}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Input
            {...inputProperties.input}
            label={t('concurso.year')}
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
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
