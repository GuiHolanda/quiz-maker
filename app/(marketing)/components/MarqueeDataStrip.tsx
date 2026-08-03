'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function MarqueeDataStrip() {
  const { t } = useTranslation();

  const items = [
    { labelKey: 'homepage.marquee.questionsToday', value: '14,203' },
    { labelKey: 'homepage.marquee.activeSessions', value: '4,891' },
    { labelKey: 'homepage.marquee.aiAccuracy', value: '98.2%' },
    { labelKey: 'homepage.marquee.certsPassed', value: '2,107' },
    { labelKey: 'homepage.marquee.awsUpdated', value: '47 New' },
    { labelKey: 'homepage.marquee.editalSync', value: 'Active' },
  ];
  const doubled = [...items, ...items];

  return (
    <div className="bg-navy-950/60 border-b border-navy-800/40 overflow-hidden h-8">
      <div className="marquee-track flex items-center h-full whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-10 px-6 h-full font-mono text-xs text-navy-400">
            <span className="text-accent font-medium">{item.value}</span> {t(item.labelKey)}
            <span className="text-navy-600 mx-4">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
