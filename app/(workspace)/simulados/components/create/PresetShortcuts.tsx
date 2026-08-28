'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faFileLines, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

import type { PresetKey } from './simuladoFormState';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface PresetShortcutsProps {
  readonly activePreset: PresetKey | null;
  readonly officialCount: number;
  readonly officialTime: string;
  readonly onPick: (key: PresetKey) => void;
}

const FIELD_LABEL = 'text-xs font-semibold text-default-400';

export function PresetShortcuts({ activePreset, officialCount, officialTime, onPick }: PresetShortcutsProps) {
  const { t } = useTranslation();

  const cards: { key: PresetKey; icon: IconDefinition; title: string; body: string; testId: string }[] = [
    {
      key: 'official',
      icon: faFileLines,
      title: t('simulado.create.presetOfficialTitle'),
      body: t('simulado.create.presetOfficialBody', { count: officialCount, time: officialTime }),
      testId: 'simulado-preset-official',
    },
    {
      key: 'quick',
      icon: faBolt,
      title: t('simulado.create.presetQuickTitle'),
      body: t('simulado.create.presetQuickBody'),
      testId: 'simulado-preset-quick',
    },
    {
      key: 'errors',
      icon: faRotateLeft,
      title: t('simulado.create.presetErrorsTitle'),
      body: t('simulado.create.presetErrorsBody'),
      testId: 'simulado-preset-errors',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className={FIELD_LABEL}>{t('simulado.create.shortcut')}</span>
      <div className="grid grid-cols-3 gap-3.5">
        {cards.map((card) => {
          const isActive = card.key === activePreset;

          return (
            <button
              key={card.key}
              aria-pressed={isActive}
              className={`flex flex-col gap-2 rounded-xl p-4 text-left transition-colors duration-200 ${
                isActive ? 'border border-primary bg-primary/[0.07]' : 'border border-transparent bg-content1'
              }`}
              data-testid={card.testId}
              type="button"
              onClick={() => onPick(card.key)}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg ${
                    isActive ? 'bg-primary/20 text-primary' : 'bg-content2 text-default-400'
                  }`}
                >
                  <FontAwesomeIcon className="text-base" icon={card.icon} />
                </span>
                <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {card.title}
                </span>
              </span>
              <span className="text-xs leading-snug text-default-500">{card.body}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
