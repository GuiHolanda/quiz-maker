'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export interface LogLine {
  readonly time: string;
  readonly text: string;
}

interface SeedExtractionLogProps {
  readonly lines: readonly LogLine[];
  readonly currentTimeLabel: string;
}

// Every line here is a real, timestamped event this session actually observed (job start,
// stage transitions) — no fabricated request/response trail. The last line is always the
// live cursor so the card never reads as stalled.
export function SeedExtractionLog({ lines, currentTimeLabel }: SeedExtractionLogProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-background2 border border-default-200 rounded-xl p-5">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon className="w-[13px] h-[13px] text-primary" icon={faTerminal} />
        <span className="font-mono text-[11px] uppercase tracking-widest text-default-400">
          {t('exam.loadingLogTitle')}
        </span>
      </div>
      <div className="mt-3.5 flex flex-col gap-2 font-mono text-xs leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr] gap-2.5">
            <span className="text-default-300">{line.time}</span>
            <span className="text-default-500">{line.text}</span>
          </div>
        ))}
        <div className="grid grid-cols-[auto_1fr] gap-2.5 text-primary">
          <span className="text-default-300">{currentTimeLabel}</span>
          <span>
            {t('exam.loadingLogRunning')}
            <span className="caret-blink">▌</span>
          </span>
        </div>
      </div>
    </div>
  );
}
