'use client';

import type { ExamIdentifyHints, ExamType } from '@/shared/types';

import { useId, useState } from 'react';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface ExamDetailsDisclosureProps {
  readonly type: ExamType;
  readonly isDisabled: boolean;
  readonly value: ExamIdentifyHints;
  readonly onChange: (value: ExamIdentifyHints) => void;
}

export function ExamDetailsDisclosure({ type, isDisabled, value, onChange }: ExamDetailsDisclosureProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const setField = (field: keyof ExamIdentifyHints) => (next: string) => onChange({ ...value, [field]: next });

  const hint = type === 'certification' ? t('exam.detailsHintCert') : t('exam.detailsHintPublicExam');

  return (
    <div className="mt-3">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex items-center gap-2 text-xs font-semibold text-primary"
        data-testid="exam-details-toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <FontAwesomeIcon
          className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          icon={faChevronDown}
        />
        {open ? t('exam.detailsHide') : t('exam.detailsShow')}
      </button>

      {!open && <p className="mt-1 text-[11px] text-default-400">{hint}</p>}

      {open && (
        <div className="mt-3 flex flex-col gap-4 rounded-xl bg-background p-4" id={panelId}>
          <p className="text-xs leading-relaxed text-default-500">{t('exam.detailsIntro')}</p>

          {type === 'certification' ? (
            <>
              <Input
                {...inputProperties.input}
                data-testid="exam-details-provider"
                isDisabled={isDisabled}
                label={t('certification.providerLabel')}
                placeholder={t('exam.detailsProviderPlaceholder')}
                value={value.provider ?? ''}
                onValueChange={setField('provider')}
              />
              <Input
                {...inputProperties.input}
                data-testid="exam-details-key"
                isDisabled={isDisabled}
                label={t('exam.keyLabel')}
                placeholder={t('exam.detailsKeyPlaceholder')}
                value={value.key ?? ''}
                onValueChange={setField('key')}
              />
            </>
          ) : (
            <>
              <Input
                {...inputProperties.input}
                data-testid="exam-details-exam-board"
                isDisabled={isDisabled}
                label={t('exam.examBoard')}
                placeholder={t('exam.detailsExamBoardPlaceholder')}
                value={value.examBoard ?? ''}
                onValueChange={setField('examBoard')}
              />
              <Input
                {...inputProperties.input}
                data-testid="exam-details-role"
                isDisabled={isDisabled}
                label={t('concurso.cargo')}
                placeholder={t('exam.detailsRolePlaceholder')}
                value={value.role ?? ''}
                onValueChange={setField('role')}
              />
              <Input
                {...inputProperties.input}
                data-testid="exam-details-edital"
                description={t('exam.detailsEditalHelp')}
                isDisabled={isDisabled}
                label={t('exam.editalKeyLabel')}
                placeholder={t('exam.detailsEditalPlaceholder')}
                value={value.edital ?? ''}
                onValueChange={setField('edital')}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
