'use client';

import NextLink from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  IconHome,
  IconSchool,
  IconClipboardText,
  IconSparkles,
  IconListDetails,
  IconPlayerPlay,
  IconSettings,
} from '@tabler/icons-react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SidebarNavProps {
  readonly collapsed?: boolean;
  readonly isMobile?: boolean;
  readonly onClose?: () => void;
}

function navLinkClass(isActive: boolean, collapsed = false): string {
  const base = collapsed
    ? 'flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200'
    : 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200';
  return `${base} ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-default-500 hover:text-foreground hover:bg-default-100'}`;
}

export function SidebarNav({ collapsed = false, isMobile = false, onClose }: SidebarNavProps) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const currentExamType = searchParams.get('type') ?? 'certification';
  const isAdminScope = pathname.startsWith('/admin');

  const col = isMobile ? false : collapsed;

  return (
    <nav className={`flex flex-col ${col ? 'items-center gap-1' : 'gap-0.5'}`}>
      <NextLink
        className={navLinkClass(pathname === '/dashboard', col)}
        href="/dashboard"
        title={col ? t('nav.dashboard') : undefined}
        onClick={onClose}
      >
        <IconHome size={16} />
        {!col && t('nav.dashboard')}
      </NextLink>

      <NextLink
        className={navLinkClass(pathname === '/exams' && currentExamType !== 'public_exam', col)}
        href="/exams?type=certification"
        title={col ? t('nav.certificates') : undefined}
        onClick={onClose}
      >
        <IconSchool size={16} />
        {!col && t('nav.certificates')}
      </NextLink>

      <NextLink
        className={navLinkClass(pathname === '/exams' && currentExamType === 'public_exam', col)}
        href="/exams?type=public_exam"
        title={col ? t('nav.concursos') : undefined}
        onClick={onClose}
      >
        <IconClipboardText size={16} />
        {!col && t('nav.concursos')}
      </NextLink>

      <NextLink
        className={navLinkClass(pathname.startsWith('/questions'), col)}
        href="/questions"
        title={col ? t('nav.generateQuestions') : undefined}
        onClick={onClose}
      >
        <IconSparkles size={16} />
        {!col && t('nav.generateQuestions')}
      </NextLink>

      <NextLink
        className={navLinkClass(pathname === '/question-bank', col)}
        href="/question-bank"
        title={col ? t('nav.questionBank') : undefined}
        onClick={onClose}
      >
        <IconListDetails size={16} />
        {!col && t('nav.questionBank')}
      </NextLink>

      <NextLink
        className={navLinkClass(pathname.startsWith('/simulados'), col)}
        href="/simulados"
        title={col ? t('nav.simulados') : undefined}
        onClick={onClose}
      >
        <IconPlayerPlay size={16} />
        {!col && t('nav.simulados')}
      </NextLink>

      {status === 'authenticated' && session?.user?.plan === 'admin' && (
        <>
          {!col && (
            <div className="pt-4 pb-1">
              <p className="px-3 text-xs font-semibold text-default-400">{t('nav.settings')}</p>
            </div>
          )}
          <NextLink
            className={navLinkClass(isAdminScope, col)}
            href="/admin"
            title={col ? t('nav.admin') : undefined}
            onClick={onClose}
          >
            <IconSettings size={16} />
            {!col && t('nav.admin')}
          </NextLink>
        </>
      )}
    </nav>
  );
}
