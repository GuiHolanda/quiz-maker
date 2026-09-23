'use client';

import type { Icon } from '@tabler/icons-react';
import type { UsageStats } from '@/shared/types';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  IconLayoutDashboard,
  IconFolderOpen,
  IconSparkles,
  IconLibrary,
  IconClipboardList,
  IconSettings,
} from '@tabler/icons-react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';

interface SidebarNavProps {
  readonly collapsed?: boolean;
  readonly isMobile?: boolean;
  readonly onClose?: () => void;
}

interface NavItem {
  readonly href: string;
  readonly labelKey: string;
  readonly icon: Icon;
  readonly isActive: (pathname: string) => boolean;
  readonly badgeKey?: keyof Pick<UsageStats, 'questionsSavedInLibrary' | 'simuladosOpen'>;
}

interface NavGroup {
  readonly titleKey: string;
  readonly items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    titleKey: 'nav.groupStudy',
    items: [
      {
        href: '/dashboard',
        labelKey: 'nav.dashboard',
        icon: IconLayoutDashboard,
        isActive: (p) => p === '/dashboard',
      },
      { href: '/exams', labelKey: 'nav.myExams', icon: IconFolderOpen, isActive: (p) => p === '/exams' },
    ],
  },
  {
    titleKey: 'nav.groupQuestions',
    items: [
      {
        href: '/questions',
        labelKey: 'nav.generateQuestions',
        icon: IconSparkles,
        isActive: (p) => p.startsWith('/questions'),
      },
      {
        href: '/question-bank',
        labelKey: 'nav.questionBank',
        icon: IconLibrary,
        isActive: (p) => p === '/question-bank',
        badgeKey: 'questionsSavedInLibrary',
      },
    ],
  },
  {
    titleKey: 'nav.groupSimulados',
    items: [
      {
        href: '/simulados',
        labelKey: 'nav.simulados',
        icon: IconClipboardList,
        isActive: (p) => p.startsWith('/simulados'),
        badgeKey: 'simuladosOpen',
      },
    ],
  },
];

function navLinkClass(isActive: boolean): string {
  const base = 'flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 text-sm transition-colors duration-200';
  return `${base} ${
    isActive
      ? 'bg-content2 border-primary text-foreground font-semibold'
      : 'border-transparent text-navy-400 font-medium hover:bg-content2 hover:text-foreground'
  }`;
}

export function SidebarNav({ collapsed = false, isMobile = false, onClose }: SidebarNavProps) {
  const { data: session, status } = useSession();
  const { usage } = useUsageContext();
  const { t } = useTranslation();
  const pathname = usePathname() ?? '';
  const isAdminScope = pathname.startsWith('/admin');
  const col = isMobile ? false : collapsed;

  return (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => renderGroup(group))}

      {status === 'authenticated' && session?.user?.plan === 'admin' && (
        <div className="flex flex-col gap-0.5">
          {!col && (
            <p className="px-3 pb-1 font-mono text-xs text-navy-500 uppercase tracking-widest">{t('nav.settings')}</p>
          )}
          <NextLink
            className={navLinkClass(isAdminScope)}
            href="/admin"
            title={col ? t('nav.admin') : undefined}
            onClick={onClose}
          >
            <IconSettings className="shrink-0" size={16} />
            {!col && <span className="truncate">{t('nav.admin')}</span>}
          </NextLink>
        </div>
      )}
    </nav>
  );

  function renderGroup(group: NavGroup) {
    return (
      <div key={group.titleKey} className="flex flex-col gap-0.5">
        {!col && (
          <p className="px-3 pb-1 font-mono text-xs text-navy-500 uppercase tracking-widest">{t(group.titleKey)}</p>
        )}
        {group.items.map((item) => {
          const ItemIcon = item.icon;
          const active = item.isActive(pathname);
          const badgeCount = item.badgeKey ? usage?.[item.badgeKey] : undefined;

          return (
            <NextLink
              key={item.href}
              className={navLinkClass(active)}
              href={item.href}
              title={col ? t(item.labelKey) : undefined}
              onClick={onClose}
            >
              <ItemIcon className="shrink-0" size={16} />
              {!col && <span className="truncate">{t(item.labelKey)}</span>}
              {!col && !!badgeCount && (
                <span className="ml-auto shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                  {badgeCount}
                </span>
              )}
            </NextLink>
          );
        })}
      </div>
    );
  }
}
