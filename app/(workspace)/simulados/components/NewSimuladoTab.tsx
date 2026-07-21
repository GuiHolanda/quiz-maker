'use client';

import { useState } from 'react';

import { NewCertSimuladoForm } from './NewCertSimuladoForm';
import { NewMockExamForm } from './NewMockExamForm';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';

type SimuladoType = 'certification' | 'concurso';

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
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <legend className="text-xs font-semibold mb-2">{t('simulado.chooseType')}</legend>
        {renderTypeOption('certification', t('simulado.typeCertification'), t('simulado.chooseTypeCertification'))}
        {renderTypeOption('concurso', t('simulado.typeConcurso'), t('simulado.chooseTypeConcurso'))}
      </fieldset>

      {type === 'certification' ? (
        <NewCertSimuladoForm onCreated={onCreated} />
      ) : (
        <NewMockExamForm onCreated={onCreated} />
      )}
    </div>
  );

  function renderTypeOption(value: SimuladoType, title: string, description: string) {
    const isSelected = type === value;

    return (
      <button
        aria-pressed={isSelected}
        className={`text-left rounded-xl border p-4 transition-colors duration-200 ${
          isSelected
            ? 'border-primary bg-primary/10'
            : 'border-default-200 bg-content1 hover:bg-content2 hover:border-default-300'
        }`}
        type="button"
        onClick={() => setType(value)}
      >
        <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{title}</p>
        <p className="text-xs text-default-400 mt-1">{description}</p>
      </button>
    );
  }
}
