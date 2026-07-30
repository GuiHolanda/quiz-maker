'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

const TD_LAST = 'px-4 py-3 text-sm text-foreground';

interface AddSectionRowProps {
  readonly showTopicsColumn: boolean;
  readonly onAdd: (name: string, min: number, max: number) => Promise<void>;
  readonly onCancel: () => void;
}

interface AddState {
  name: string;
  min: number;
  max: number;
}

export function AddSectionRow({ showTopicsColumn, onAdd, onCancel }: AddSectionRowProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<AddState>({ name: '', min: 0, max: 0 });
  const [saving, setSaving] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const handleSave = async () => {
    if (!state.name.trim()) {
      setNameTouched(true);
      return;
    }
    setSaving(true);
    try {
      await onAdd(state.name.trim(), state.min, state.max);
    } finally {
      setSaving(false);
    }
  };

  const setField = (field: keyof AddState, value: string) => {
    if (field === 'name') {
      setState((s) => ({ ...s, name: value }));
    } else {
      setState((s) => ({ ...s, [field]: Math.min(100, Math.max(0, Number(value) || 0)) }));
    }
  };

  return (
    <tr className="bg-content1">
      <td className={TD_LAST}>
        <Input
          {...inputProperties.input}
          className="w-48"
          errorMessage={nameTouched && !state.name.trim() ? t('error.nameRequired') : undefined}
          isInvalid={nameTouched && !state.name.trim()}
          placeholder={t('exam.sectionNamePlaceholder')}
          size="sm"
          value={state.name}
          onChange={(e) => setField('name', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </td>
      <td className={TD_LAST}>
        <Input
          {...inputProperties.input}
          className="w-24"
          endContent={<span className="text-default-400 text-sm">%</span>}
          max={100}
          min={0}
          size="sm"
          type="number"
          value={String(state.min)}
          onChange={(e) => setField('min', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </td>
      <td className={TD_LAST}>
        <Input
          {...inputProperties.input}
          className="w-24"
          endContent={<span className="text-default-400 text-sm">%</span>}
          max={100}
          min={0}
          size="sm"
          type="number"
          value={String(state.max)}
          onChange={(e) => setField('max', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </td>
      {showTopicsColumn && <td className={TD_LAST}>—</td>}
      <td className={TD_LAST}>
        <div className="flex gap-2">
          <Button className={buttonStyles.primarySm} isLoading={saving} size="sm" onPress={handleSave}>
            {t('common.save')}
          </Button>
          <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={onCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </td>
    </tr>
  );
}
