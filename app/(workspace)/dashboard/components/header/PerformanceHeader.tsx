'use client';

import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faFileContract } from '@fortawesome/free-solid-svg-icons';

import { ReadinessGauge } from './ReadinessGauge';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function PerformanceHeader() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [hour, setHour] = useState(0);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const first = session?.user?.name?.split(' ')[0] ?? '';
  let greeting: string;
  if (hour < 12) greeting = `${t('dashboard.greeting.morning')}, ${first}.`;
  else if (hour < 18) greeting = `${t('dashboard.greeting.afternoon')}, ${first}.`;
  else greeting = `${t('dashboard.greeting.evening')}, ${first}.`;

  return (
    <section className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-6 lg:p-8">
          <h2 className="font-bold text-foreground text-2xl lg:text-3xl mb-2 leading-snug">
            {greeting} <span className="text-primary">{t('dashboard.onTrack')}</span>
          </h2>
          <p className="text-default-500 text-sm mb-6 max-w-sm">
            {t('dashboard.weakAreasNote', { count: '-' })}
          </p>
          <div className="flex gap-3 max-w-xs">
            <NextLink
              className="flex items-center gap-2 bg-foreground text-background font-semibold text-xs py-2.5 px-4 rounded-lg transition-opacity hover:opacity-80"
              href="/questions"
            >
              <FontAwesomeIcon className="text-primary text-xs" icon={faBolt} />
              {t('dashboard.quickPractice')}
            </NextLink>
            <NextLink
              className="flex items-center gap-2 border border-default-200 text-foreground hover:border-default-400 font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors"
              href="/simulados"
            >
              <FontAwesomeIcon className="text-default-400 text-xs" icon={faFileContract} />
              {t('dashboard.mockExam')}
            </NextLink>
          </div>
        </div>
        <ReadinessGauge />
      </div>
    </section>
  );
}
