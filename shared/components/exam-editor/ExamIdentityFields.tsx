'use client';
import type { Exam, ExamBoard, Provider } from '@/shared/types';

import { useEffect, useState } from 'react';
import { Input } from '@heroui/input';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getProviders, getExamBoards } from '@/features/connectors';
import { inputProperties, compactInputClassNames } from '@/config/constants/inputStyles';

export type FieldDensity = 'compact' | 'comfortable';

interface ExamIdentityFieldsProps {
  readonly draft: Exam;
  readonly isSaving: boolean;
  readonly density?: FieldDensity;
  readonly onUpdateField: (
    field: keyof Pick<Exam, 'name' | 'role' | 'year' | 'key'>,
    value: string | number | null
  ) => void;
  readonly onUpdateReferenceName: (name: string) => void;
}

// Fragment of two sibling rows, not a wrapping <div> — the caller's flex gap owns the spacing.
export function ExamIdentityFields({
  draft,
  isSaving,
  density = 'compact',
  onUpdateField,
  onUpdateReferenceName,
}: ExamIdentityFieldsProps) {
  const { t } = useTranslation();
  const [referenceEntities, setReferenceEntities] = useState<Provider[] | ExamBoard[]>([]);

  const isCertification = draft.type === 'certification';
  const isCompact = density === 'compact';
  const referenceName = isCertification ? (draft.provider?.name ?? '') : (draft.examBoard?.name ?? '');
  const referenceLabel = isCertification ? t('exam.provider') : t('exam.examBoard');
  const inputClassNames = isCompact ? compactInputClassNames : inputProperties.input.classNames;
  const autocompleteInputProps = isCompact
    ? { classNames: compactInputClassNames }
    : inputProperties.autocomplete.inputProps;

  useEffect(() => {
    const fetcher = isCertification ? getProviders : getExamBoards;

    fetcher()
      .then((items) => setReferenceEntities(items as Provider[] | ExamBoard[]))
      .catch(() => {});
  }, [isCertification]);

  return (
    <>
      <div className="flex gap-4">
        <Input
          {...inputProperties.input}
          classNames={inputClassNames}
          data-testid="exam-editor-name-input"
          isDisabled={isSaving}
          label={t('exam.name')}
          placeholder=" "
          value={draft.name}
          onValueChange={(v) => onUpdateField('name', v)}
          size="sm"
          className="grow"
        />
        <Input
          {...inputProperties.input}
          classNames={inputClassNames}
          isDisabled={isSaving}
          label={isCertification ? t('exam.keyLabel') : t('exam.editalKeyLabel')}
          placeholder={isCertification ? t('exam.certKeyPlaceholder') : t('exam.editalKeyPlaceholder')}
          value={draft.key ?? ''}
          onValueChange={(v) => onUpdateField('key', v || null)}
          size="sm"
          className={isCompact ? 'w-1/5' : 'w-[200px]'}
        />
      </div>

      <div className="flex gap-4">
        {!isCertification && (
          <Input
            {...inputProperties.input}
            classNames={inputClassNames}
            isDisabled={isSaving}
            label={t('exam.role')}
            placeholder=" "
            value={draft.role ?? ''}
            onValueChange={(v) => onUpdateField('role', v || null)}
            size="sm"
            className={isCompact ? undefined : 'flex-1'}
          />
        )}
        <Autocomplete
          allowsCustomValue
          {...inputProperties.autocomplete}
          inputProps={autocompleteInputProps}
          inputValue={referenceName}
          isDisabled={isSaving}
          label={referenceLabel}
          placeholder={isCertification ? t('certification.providerPlaceholder') : t('concurso.bancaPlaceholder')}
          size="sm"
          className={isCompact ? 'w-2/5' : 'flex-1'}
          onInputChange={onUpdateReferenceName}
        >
          {referenceEntities.map((entity) => (
            <AutocompleteItem key={entity.name}>{entity.name}</AutocompleteItem>
          ))}
        </Autocomplete>
        <Input
          {...inputProperties.input}
          classNames={inputClassNames}
          isDisabled={isSaving}
          label={t('exam.year')}
          placeholder=" "
          type="number"
          value={draft.year?.toString() ?? ''}
          onValueChange={(v) => onUpdateField('year', v ? parseInt(v, 10) : null)}
          size="sm"
          className={isCompact ? 'w-1/5' : 'w-[140px]'}
        />
      </div>
    </>
  );
}
