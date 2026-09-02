'use client';

import { Button } from '@heroui/button';

import { FieldLabel } from '@/shared/components/ui/FieldLabel';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { FauxCheckbox } from '@/shared/components/ui/FauxCheckbox';

interface TopicRow {
  readonly name: string;
  readonly weight: number;
  readonly count: number;
  readonly available: number | null;
}

interface TopicChecklistProps {
  readonly sections: TopicRow[];
  readonly selected: string[];
  readonly onToggle: (name: string) => void;
  readonly onAll: () => void;
  readonly onNone: () => void;
}

const ROW_GRID = '22px minmax(120px,1fr) 100px 110px';

export function TopicChecklist({ sections, selected, onToggle, onAll, onNone }: TopicChecklistProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{t('simulado.create.topicsLabel')}</FieldLabel>
        <div className="flex items-center gap-2">
          <Button className={buttonStyles.flat} data-testid="simulado-topics-select-all" size="sm" onPress={onAll}>
            {t('simulado.create.selectAll')}
          </Button>
          <Button className={buttonStyles.flat} data-testid="simulado-topics-clear" size="sm" onPress={onNone}>
            {t('simulado.create.clearAll')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-divider">
        <div className="min-w-[440px]">
          {sections.map((section) => {
            const isChecked = selected.includes(section.name);
            const isInsufficient = isChecked && section.available !== null && section.count > section.available;

            return (
              <button
                key={section.name}
                aria-checked={isChecked}
                className="grid w-full items-center gap-4 border-t border-divider px-4 py-3 text-left first:border-t-0"
                data-testid="simulado-topic-toggle"
                role="checkbox"
                style={{ gridTemplateColumns: ROW_GRID }}
                type="button"
                onClick={() => onToggle(section.name)}
              >
                <FauxCheckbox checked={isChecked} />

                <span className={`truncate text-sm ${isChecked ? 'text-foreground' : 'text-default-500'}`}>
                  {section.name}
                </span>

                <span className="font-mono text-[11px] text-default-400">
                  {t('simulado.create.topicWeight', { weight: section.weight })}
                </span>

                <span
                  className={`text-right font-mono text-xs ${
                    isInsufficient ? 'text-danger' : isChecked ? 'text-foreground' : 'text-default-400'
                  }`}
                >
                  {t('simulado.create.topicQuestions', { count: isChecked ? section.count : 0 })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
