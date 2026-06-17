'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

const TD_LAST = 'px-4 py-3 text-sm text-foreground';

interface AddSubjectRowProps {
  readonly onAdd: (name: string, min: number, max: number) => Promise<void>;
  readonly onCancel: () => void;
}

interface AddState {
  name: string;
  min: number;
  max: number;
}

export function AddSubjectRow({ onAdd, onCancel }: AddSubjectRowProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<AddState>({ name: '', min: 0, max: 0 });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!state.name.trim()) return;
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
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="w-48"
          placeholder={t('concurso.subjectNamePlaceholder')}
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
      <td className={TD_LAST}>—</td>
      <td className={TD_LAST}>
        <div className="flex gap-2">
          <Button
            className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 h-8 px-3 transition-opacity duration-200"
            isLoading={saving}
            size="sm"
            onPress={handleSave}
          >
            {t('common.save')}
          </Button>
          <Button
            className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold h-8 px-3 transition-colors duration-200"
            size="sm"
            variant="bordered"
            onPress={onCancel}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </td>
    </tr>
  );
}
