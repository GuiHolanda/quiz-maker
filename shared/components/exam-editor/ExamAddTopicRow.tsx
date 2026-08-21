'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties, compactInputClassNames } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamAddTopicRowProps {
  readonly isSaving: boolean;
  readonly onAdd: (name: string) => void;
}

export function ExamAddTopicRow({ isSaving, onAdd }: ExamAddTopicRowProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const submit = () => {
    if (value.trim()) {
      onAdd(value);
      setValue('');
    }
  };

  return (
    <div className="bg-background pl-[52px] pr-3 py-4">
      <div className="flex justify-between items-center gap-3">
        <Input
          {...inputProperties.input}
          className="w-52"
          classNames={compactInputClassNames}
          isDisabled={isSaving}
          placeholder={t('exam.addTopic')}
          size="sm"
          value={value}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          onValueChange={setValue}
        />
        <Button
          className={`${buttonStyles.primarySm} h-7 px-4`}
          isDisabled={isSaving || !value.trim()}
          size="sm"
          onPress={submit}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
