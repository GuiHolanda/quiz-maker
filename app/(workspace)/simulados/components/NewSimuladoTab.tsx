'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { NewCertSimuladoForm } from './NewCertSimuladoForm';
import { NewMockExamForm } from './NewMockExamForm';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { SimuladoType } from '@/shared/types';

interface NewSimuladoTabProps {
  readonly onCreated: () => void;
}

export function NewSimuladoTab({ onCreated }: NewSimuladoTabProps) {
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const [type, setType] = useState<SimuladoType>('certification');

  const hasConcursoAccess = !usage || usage.publicExamsLimit !== 0;

  if (!hasConcursoAccess) {
    return <NewCertSimuladoForm onCreated={onCreated} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">{t('simulado.chooseType')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={t('simulado.chooseType')}>
          {renderTypeOption(
            'certification',
            t('simulado.typeCertification'),
            t('simulado.chooseTypeCertification'),
            faGraduationCap
          )}
          {renderTypeOption('concurso', t('simulado.typeConcurso'), t('simulado.chooseTypeConcurso'), faClipboardList)}
        </div>
      </div>

      {type === 'certification' ? (
        <NewCertSimuladoForm onCreated={onCreated} />
      ) : (
        <NewMockExamForm onCreated={onCreated} />
      )}
    </div>
  );

  function renderTypeOption(value: SimuladoType, title: string, description: string, icon: IconDefinition) {
    const isSelected = type === value;

    return (
      <button
        aria-pressed={isSelected}
        data-testid={`type-option-${value}`}
        className={`text-left rounded-xl border p-4 transition-colors duration-200 flex items-start gap-3 ${
          isSelected
            ? 'border-primary bg-primary/10'
            : 'border-default-200 bg-content1 hover:bg-content2 hover:border-default-300'
        }`}
        type="button"
        onClick={() => setType(value)}
      >
        <span className={`mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-default-400'}`}>
          <FontAwesomeIcon className="w-4 h-4" icon={icon} />
        </span>
        <span className="flex flex-col gap-0.5 min-w-0">
          <span className={`text-sm font-semibold leading-snug ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {title}
          </span>
          <span className="text-xs text-default-500 leading-snug">{description}</span>
        </span>
      </button>
    );
  }
}
