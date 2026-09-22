'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { ExamTypePickerModal } from '@/app/(workspace)/exams/components/ExamTypePickerModal';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamType } from '@/shared/types';

interface HomeHeaderProps {
  readonly summaryExams: number;
  readonly summaryWrong: number;
  readonly resumeName: string | null;
  readonly loading: boolean;
}

export function HomeHeader({ summaryExams, summaryWrong, resumeName, loading }: HomeHeaderProps) {
  const { data: session } = useSession();
  const { t, language } = useTranslation();
  const router = useRouter();
  const [hour, setHour] = useState(0);
  const [dateLabel, setDateLabel] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setHour(now.getHours());
    setDateLabel(
      new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
        .format(now)
        .toUpperCase()
    );
  }, [language]);

  const first = session?.user?.name?.split(' ')[0] ?? '';
  const greetingKey =
    hour < 12
      ? 'dashboard.greeting.morning'
      : hour < 18
        ? 'dashboard.greeting.afternoon'
        : 'dashboard.greeting.evening';
  const greeting = `${t(greetingKey)}${first ? `, ${first}` : ''}.`;

  const summary = loading
    ? ''
    : summaryExams === 0 && summaryWrong === 0
      ? t('dashboard.home.summaryEmpty')
      : [
          summaryExams > 0 ? t('dashboard.home.summaryExams', { count: summaryExams }) : null,
          summaryWrong > 0 ? t('dashboard.home.summaryWrong', { count: summaryWrong }) : null,
          resumeName ? t('dashboard.home.summaryResume', { name: resumeName }) : null,
        ]
          .filter(Boolean)
          .join(' · ');

  const handleConfirmType = (type: ExamType) => {
    setIsPickerOpen(false);
    router.push(`/exams/new?type=${type}`);
  };

  return (
    <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-divider pb-6">
      <div className="min-w-0">
        <p className="font-mono text-xs text-default-400 tracking-wide">{dateLabel}</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-foreground">
          {greeting}
        </h1>
        <p className="mt-2 text-sm text-default-500 max-w-xl text-pretty min-h-[1.25rem]">{summary}</p>
      </div>
      <Button
        className={buttonStyles.primary}
        startContent={<FontAwesomeIcon className="text-xs" icon={faPlus} />}
        onPress={() => setIsPickerOpen(true)}
      >
        {t('dashboard.home.newCert')}
      </Button>
      <ExamTypePickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onConfirm={handleConfirmType} />
    </section>
  );
}
