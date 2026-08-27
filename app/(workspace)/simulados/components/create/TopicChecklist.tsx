'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface TopicRow {
  readonly name: string;
  readonly weight: number;
  readonly count: number;
  readonly available?: number;
}

interface TopicChecklistProps {
  readonly sections: TopicRow[];
  readonly selected: string[];
  readonly onToggle: (name: string) => void;
  readonly onAll: () => void;
  readonly onNone: () => void;
}

const FIELD_LABEL = 'text-xs font-semibold text-default-400';
const ROW_GRID = '22px minmax(120px,1fr) 100px 110px';

export function TopicChecklist({ sections, selected, onToggle, onAll, onNone }: TopicChecklistProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className={FIELD_LABEL}>{t('simulado.create.topicsLabel')}</span>
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
            const isInsufficient = isChecked && section.available !== undefined && section.count > section.available;

            return (
              <button
                key={section.name}
                className="grid w-full items-center gap-4 border-t border-divider px-4 py-3 text-left first:border-t-0"
                data-testid="simulado-topic-toggle"
                style={{ gridTemplateColumns: ROW_GRID }}
                type="button"
                onClick={() => onToggle(section.name)}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-[5px] border transition-colors duration-200 ${
                    isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-divider'
                  }`}
                >
                  {isChecked && <FontAwesomeIcon className="h-3 w-3" icon={faCheck} />}
                </span>

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
