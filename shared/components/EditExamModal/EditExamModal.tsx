'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Button } from '@heroui/button';

import { Exam, ExamBoard, Provider } from '@/shared/types';
import { updateExamMeta, getProviders, getExamBoards } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

export interface EditExamModalCertResult {
  name: string;
  key?: string | null;
  provider?: Provider | null;
  totalQuestions: number;
  examDurationMinutes?: number;
  passingScore?: number;
}

export interface EditExamModalPublicExamResult {
  name: string;
  key?: string | null;
  role?: string;
  year?: number;
  examBoard: ExamBoard;
  totalQuestions: number;
  examDurationMinutes?: number;
  passingScore?: number;
}

interface EditExamModalProps {
  readonly exam: Exam | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (id: string, updated: EditExamModalCertResult | EditExamModalPublicExamResult) => void;
}

export function EditExamModal({ exam, isOpen, onClose, onSaved }: EditExamModalProps) {
  const { t } = useTranslation();
  const isCert = exam?.type === 'certification';

  const [name, setName] = useState('');
  const [examKey, setExamKey] = useState('');
  const [provider, setProvider] = useState('');
  const [examBoardName, setExamBoardName] = useState('');
  const [role, setRole] = useState('');
  const [year, setYear] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [examDurationMinutes, setExamDurationMinutes] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [boards, setBoards] = useState<ExamBoard[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exam) {
      setName(exam.name);
      setExamKey(exam.key ?? '');
      setProvider(exam.provider?.name ?? '');
      setExamBoardName(exam.examBoard?.name ?? '');
      setRole(exam.role ?? '');
      setYear(exam.year != null ? String(exam.year) : '');
      setTotalQuestions(String(exam.totalQuestions));
      setExamDurationMinutes(exam.examDurationMinutes != null ? String(exam.examDurationMinutes) : '');
      setPassingScore(exam.passingScore != null ? String(exam.passingScore) : '');
    }
  }, [exam]);

  useEffect(() => {
    if (!isOpen) return;
    if (isCert) {
      getProviders()
        .then(setProviders)
        .catch(() => {});
    } else {
      getExamBoards()
        .then(setBoards)
        .catch(() => {});
    }
  }, [isOpen, isCert]);

  const handleSave = async () => {
    if (!exam?.id || !name.trim()) return;
    if (!isCert && !examBoardName.trim()) return;

    const totalQuestionsNum = parseInt(totalQuestions, 10);

    if (!totalQuestionsNum || totalQuestionsNum < 1) {
      notify.error(t('toast.validationError'), t('error.totalQuestionsRequired'));
      return;
    }

    setSaving(true);
    try {
      if (isCert) {
        await updateExamMeta(exam.id, {
          newName: name.trim(),
          newKey: examKey.trim() || null,
          newProviderName: provider.trim() || null,
          newTotalQuestions: totalQuestionsNum,
          newExamDurationMinutes: parseInt(examDurationMinutes, 10) || null,
          newPassingScore: parseFloat(passingScore) || null,
        });
        onSaved(exam.id, {
          name: name.trim(),
          key: examKey.trim() || null,
          provider: provider.trim() ? { name: provider.trim() } : null,
          totalQuestions: totalQuestionsNum,
          examDurationMinutes: parseInt(examDurationMinutes, 10) || undefined,
          passingScore: parseFloat(passingScore) || undefined,
        });
      } else {
        const yearNum = year ? Number(year) : null;

        await updateExamMeta(exam.id, {
          newName: name.trim(),
          newKey: examKey.trim() || null,
          newRole: role.trim() || null,
          newYear: yearNum,
          newExamBoardName: examBoardName.trim(),
          newTotalQuestions: totalQuestionsNum,
          newExamDurationMinutes: parseInt(examDurationMinutes, 10) || null,
          newPassingScore: parseFloat(passingScore) || null,
        });
        onSaved(exam.id, {
          name: name.trim(),
          key: examKey.trim() || null,
          role: role.trim() || undefined,
          year: yearNum ?? undefined,
          examBoard: { name: examBoardName.trim() },
          totalQuestions: totalQuestionsNum,
          examDurationMinutes: parseInt(examDurationMinutes, 10) || undefined,
          passingScore: parseFloat(passingScore) || undefined,
        });
      }
      notify.success(t('toast.success'), t('toast.savedSuccessfully', { title: name.trim() }));
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      notify.error(t('toast.error'), msg || t('toast.failedToUpdate', { name: name.trim() }));
    } finally {
      setSaving(false);
    }
  };

  const title = isCert ? t('certification.editCertification') : t('concurso.editPublicExam');

  return (
    <Modal isOpen={isOpen} size="xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="text-base font-semibold text-foreground border-b border-default-200">
          {title}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4 py-8">
          <Input
            {...inputProperties.input}
            classNames={{ inputWrapper: 'h-8 bg-background', input: 'text-xs font-semibold' }}
            label={isCert ? t('certification.certificationTitle') : t('concurso.name')}
            placeholder={isCert ? t('certification.certificationTitlePlaceholder') : t('concurso.namePlaceholder')}
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />

          <Input
            {...inputProperties.input}
            classNames={{ inputWrapper: 'h-8 bg-background', input: 'text-xs font-semibold' }}
            label={isCert ? t('exam.keyLabel') : t('exam.editalKeyLabel')}
            placeholder={isCert ? t('exam.certKeyPlaceholder') : t('exam.editalKeyPlaceholder')}
            size="sm"
            value={examKey}
            onChange={(e) => setExamKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />

          <div className="flex gap-2">
            <Input
              isRequired
              {...inputProperties.input}
              classNames={{ inputWrapper: 'h-8 bg-background', input: 'text-xs font-semibold' }}
              className="w-1/3"
              label={t('certification.totalQuestions')}
              min={1}
              placeholder="e.g. 65"
              size="sm"
              type="number"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Input
              {...inputProperties.input}
              classNames={{ inputWrapper: 'h-8 bg-background', input: 'text-xs font-semibold' }}
              className="w-1/3"
              endContent={
                <span className="text-xs text-default-400 self-center">{t('certification.examDurationUnit')}</span>
              }
              label={t('certification.examDuration')}
              min={1}
              placeholder="e.g. 130"
              size="sm"
              type="number"
              value={examDurationMinutes}
              onChange={(e) => setExamDurationMinutes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Input
              {...inputProperties.input}
              classNames={{ inputWrapper: 'h-8 bg-background', input: 'text-xs font-semibold' }}
              className="w-1/3"
              endContent={<span className="text-xs text-default-400 self-center">%</span>}
              label={t('certification.passingScore')}
              max={100}
              min={0}
              placeholder="e.g. 72"
              size="sm"
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          {isCert ? renderCertFields() : renderPublicExamFields()}
        </ModalBody>
        <ModalFooter className="border-t border-default-200">
          <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className={buttonStyles.primary} isLoading={saving} size="sm" onPress={handleSave}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  function renderCertFields() {
    return (
      <Autocomplete
        allowsCustomValue
        {...inputProperties.autocomplete}
        className="w-fit"
        inputValue={provider}
        label={t('exam.providerLabel')}
        placeholder={t('certification.providerPlaceholder')}
        onInputChange={setProvider}
      >
        {providers.map((p) => (
          <AutocompleteItem key={p.name}>{p.name}</AutocompleteItem>
        ))}
      </Autocomplete>
    );
  }

  function renderPublicExamFields() {
    return (
      <div className="flex flex-col gap-4">
        <Input
          {...inputProperties.input}
          classNames={{ inputWrapper: 'h-8 bg-background', input: 'text-xs font-semibold' }}
          label={t('concurso.cargo')}
          placeholder={t('concurso.cargoPlaceholder')}
          size="sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="flex gap-2 items-end">
          <Autocomplete
            allowsCustomValue
            {...inputProperties.autocomplete}
            inputValue={examBoardName}
            label={t('exam.examBoardLabel')}
            placeholder={t('concurso.bancaPlaceholder')}
            onInputChange={setExamBoardName}
            size="sm"
            className="w-fit"
          >
            {boards.map((b) => (
              <AutocompleteItem key={b.name}>{b.name}</AutocompleteItem>
            ))}
          </Autocomplete>
          <Input
            {...inputProperties.input}
            classNames={{ inputWrapper: 'h-8 bg-background', input: 'text-xs font-semibold' }}
            label={t('concurso.year')}
            placeholder={t('concurso.yearPlaceholder')}
            size="sm"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-fit"
          />
        </div>
      </div>
    );
  }
}
