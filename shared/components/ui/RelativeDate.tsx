'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface RelativeDateProps {
  readonly date: string;
}

export function RelativeDate({ date }: RelativeDateProps) {
  const { language } = useTranslation();
  const locale = language === 'en' ? 'en-US' : 'pt-BR';
  const d = new Date(date);
  const absolute = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  const relative = formatRelative(d, locale);

  return (
    <time dateTime={date} title={absolute}>
      {relative}
    </time>
  );
}

function formatRelative(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  return rtf.format(diffYear, 'year');
}
