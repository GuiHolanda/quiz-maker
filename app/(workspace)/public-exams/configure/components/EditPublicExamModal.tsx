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
import { buttonStyles } from '@/config/constants/buttonStyles';

interface EditPublicExamModalProps {
  publicExam: PublicExam | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (id: string, updated: { name: string; role?: string; year?: number; examBoard: ExamBoard; totalQuestions: number; examDurationMinutes?: number; passingScore?: number }) => void;
}

export function EditPublicExamModal({ publicExam, isOpen, onClose, onSaved }: EditPublicExamModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [year, setYear] = useState('');
  const [examBoardName, setExamBoardName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [examDurationMinutes, setExamDurationMinutes] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [boards, setBoards] = useState<ExamBoard[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (publicExam) {
      setName(publicExam.name);
      setRole(publicExam.role ?? '');
      setYear(publicExam.year != null ? String(publicExam.year) : '');
      setExamBoardName(publicExam.examBoard?.name ?? '');
      setTotalQuestions(String(publicExam.totalQuestions));
      setExamDurationMinutes(publicExam.examDurationMinutes != null ? String(publicExam.examDurationMinutes) : '');
      setPassingScore(publicExam.passingScore != null ? String(publicExam.passingScore) : '');
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
    const totalQuestionsNum = parseInt(totalQuestions, 10);

    if (!totalQuestionsNum || totalQuestionsNum < 1) {
      notify.error(t('toast.validationError'), t('error.totalQuestionsRequired'));
      return;
    }
    setSaving(true);
    try {
      const yearNum = year ? Number(year) : null;

      await updatePublicExamMeta(publicExam.id, {
        newName: name.trim(),
        newRole: role.trim() || null,
        newYear: yearNum,
        newExamBoardName: examBoardName.trim(),
        newTotalQuestions: totalQuestionsNum,
        newExamDurationMinutes: parseInt(examDurationMinutes, 10) || null,
        newPassingScore: parseFloat(passingScore) || null,
      });
      onSaved(publicExam.id, {
        name: name.trim(),
        role: role.trim() || undefined,
        year: yearNum ?? undefined,
        examBoard: { name: examBoardName.trim() },
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
        <ModalHeader className="text-base font-semibold text-foreground">{t('concurso.editPublicExam')}</ModalHeader>
        <ModalBody className="flex flex-col gap-4 pb-2">
          <Input
            {...inputProperties.input}
            label={t('concurso.name')}
            placeholder={t('concurso.namePlaceholder')}
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
            placeholder={t('concurso.cargoPlaceholder')}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Input
            {...inputProperties.input}
            label={t('concurso.year')}
            placeholder={t('concurso.yearPlaceholder')}
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              isRequired
              {...inputProperties.input}
              label={t('certification.totalQuestions')}
              min={1}
              placeholder="e.g. 80"
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
              placeholder="e.g. 240"
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
              placeholder="e.g. 70"
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
