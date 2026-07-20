'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from '@heroui/drawer';
import { Avatar } from '@heroui/avatar';
import NextLink from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronLeft,
  faGear,
  faGraduationCap,
  faClipboard,
  faListUl,
  faPlay,
  faBars,
  faXmark,
  faHouse,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { SIDEBAR_COLLAPSED_LOCAL_STORAGE_KEY } from '@/config/constants';

const CERTIFICATION_ITEMS = [
  { labelKey: 'nav.configureCertification', href: '/certifications/configure', icon: faGear },
  { labelKey: 'nav.questions', href: '/certifications/questions', icon: faListUl },
  { labelKey: 'nav.simulados', href: '/certifications/simulados', icon: faPlay },
] as const;

const CONCURSO_ITEMS = [
  { labelKey: 'nav.configureConcurso', href: '/public-exams/configure', icon: faGear },
  { labelKey: 'nav.questions', href: '/public-exams/questions', icon: faListUl },
  { labelKey: 'nav.simulados', href: '/public-exams/simulados', icon: faPlay },
] as const;

type ExpandedSection = 'certifications' | 'public-exams' | null;

function navLinkClass(isActive: boolean, collapsed = false) {
  const base = collapsed
    ? 'flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200'
    : 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200';
  return `${base} ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-default-500 hover:text-foreground hover:bg-default-100'}`;
}

function sectionHeaderClass(isActive: boolean, collapsed = false) {
  const base = collapsed
    ? 'flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200'
    : 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200';
  return `${base} ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-default-500 hover:text-foreground hover:bg-default-100'}`;
}

function subItemClass(isActive: boolean) {
  return `flex items-center gap-3 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-colors duration-200 ${
    isActive ? 'text-primary font-semibold bg-primary/10' : 'text-default-400 hover:text-foreground hover:bg-default-100'
  }`;
}

export function Sidebar() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const pathname = usePathname() ?? '';
  const isCertificationsScope = pathname.startsWith('/certifications');
  const isConcursosScope = pathname.startsWith('/public-exams');
  const isAdminScope = pathname.startsWith('/admin');

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_LOCAL_STORAGE_KEY) === 'true';
  });
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(() => {
    if (isCertificationsScope) return 'certifications';
    if (isConcursosScope) return 'public-exams';
    return null;
  });

  const showConcursos = !usage || usage.publicExamsLimit !== 0;

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_LOCAL_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex shrink-0 h-screen sticky top-0 flex-col bg-background border-r border-divider overflow-y-auto transition-[width] duration-200 ease-out ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        {renderBrand()}
        <div className={`flex-1 overflow-y-auto py-3 ${isCollapsed ? 'px-3 flex flex-col items-center' : 'px-3'}`}>
          {renderNav()}
        </div>
        {renderUsageCounters()}
      </aside>

      {/* Mobile top bar */}
      <div className="flex md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-background2 border-b border-divider items-center justify-between px-4">
        <button
          aria-label={t('aria.openMenu')}
          className="p-2 text-default-500 hover:text-foreground transition-colors"
          onClick={() => setIsMobileOpen(true)}
        >
          <FontAwesomeIcon className="w-5 h-5" icon={faBars} />
        </button>
        <NextLink className="flex items-center gap-2" href="/">
          <Image alt="CertifiqueAI" className="rounded-md" height={22} src="/icon.svg" width={22} />
          <p className="font-sora font-semibold text-foreground tracking-wide text-sm">Certifique AI</p>
        </NextLink>
        <Avatar
          classNames={{ base: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-transparent' }}
          name={session?.user?.name ?? session?.user?.email ?? undefined}
          size="sm"
          src={session?.user?.image ?? undefined}
        />
      </div>

      {/* Mobile drawer */}
      <Drawer hideCloseButton isOpen={isMobileOpen} placement="left" size="xs" onClose={() => setIsMobileOpen(false)}>
        <DrawerContent className="bg-background2">
          <DrawerHeader className="flex items-center justify-between border-b border-divider px-4 py-3">
            <NextLink className="flex items-center gap-2" href="/" onClick={() => setIsMobileOpen(false)}>
              <Image alt="CertifiqueAI" className="rounded-md" height={22} src="/icon.svg" width={22} />
              <p className="font-sora font-semibold text-foreground tracking-wide text-sm">Certifique AI</p>
            </NextLink>
            <button
              aria-label={t('nav.closeSidebar')}
              className="p-1.5 text-default-400 hover:text-foreground transition-colors rounded-lg hover:bg-default-100"
              onClick={() => setIsMobileOpen(false)}
            >
              <FontAwesomeIcon className="w-4 h-4" icon={faXmark} />
            </button>
          </DrawerHeader>
          <DrawerBody className="px-3 py-3">
            {renderNav(true)}
            {renderUsageCounters()}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );

  function renderBrand() {
    return (
      <div className={`h-14 flex items-center border-b border-divider shrink-0 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
        {!isCollapsed && (
          <NextLink className="flex items-center gap-2 flex-1 min-w-0" href="/">
            <Image alt="CertifiqueAI" className="rounded-md shrink-0" height={22} src="/icon.svg" width={22} />
            <p className="font-sora font-semibold text-foreground tracking-wide text-sm truncate">Certifique AI</p>
          </NextLink>
        )}
        {isCollapsed && (
          <NextLink href="/">
            <Image alt="CertifiqueAI" className="rounded-md" height={22} src="/icon.svg" width={22} />
          </NextLink>
        )}
        <button
          aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          className={`p-1.5 text-default-400 hover:text-foreground transition-colors rounded-lg hover:bg-default-100 shrink-0 ${isCollapsed ? 'mt-0' : 'ml-auto'}`}
          onClick={toggleCollapsed}
        >
          <FontAwesomeIcon
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
            icon={faChevronLeft}
          />
        </button>
      </div>
    );
  }

  function renderNav(isMobile = false) {
    const closeDrawer = isMobile ? () => setIsMobileOpen(false) : undefined;
    const collapsed = !isMobile && isCollapsed;

    return (
      <nav className={`flex flex-col ${collapsed ? 'items-center gap-1' : 'gap-0.5'}`}>
        {/* Dashboard */}
        <NextLink
          className={navLinkClass(pathname === '/dashboard', collapsed)}
          href="/dashboard"
          title={collapsed ? t('nav.dashboard') : undefined}
          onClick={closeDrawer}
        >
          <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faHouse} />
          {!collapsed && t('nav.dashboard')}
        </NextLink>

        {/* Certifications section */}
        <button
          className={sectionHeaderClass(isCertificationsScope, collapsed)}
          title={collapsed ? t('nav.certificates') : undefined}
          onClick={() => {
            if (collapsed) {
              toggleCollapsed();
              setExpandedSection('certifications');
            } else {
              setExpandedSection((prev) => (prev === 'certifications' ? null : 'certifications'));
            }
          }}
        >
          <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faGraduationCap} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{t('nav.certificates')}</span>
              <FontAwesomeIcon
                className={`w-3 h-3 transition-transform duration-200 ${expandedSection === 'certifications' ? 'rotate-180' : ''}`}
                icon={faChevronDown}
              />
            </>
          )}
        </button>
        {!collapsed && expandedSection === 'certifications' && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {CERTIFICATION_ITEMS.map((item) => (
              <NextLink
                key={item.href}
                className={subItemClass(pathname === item.href)}
                href={item.href}
                onClick={closeDrawer}
              >
                <FontAwesomeIcon className="w-3 h-3 shrink-0" icon={item.icon} />
                {t(item.labelKey)}
              </NextLink>
            ))}
          </div>
        )}

        {/* Concursos section */}
        {showConcursos && (
          <>
            <button
              className={sectionHeaderClass(isConcursosScope, collapsed)}
              title={collapsed ? t('nav.concursos') : undefined}
              onClick={() => {
                if (collapsed) {
                  toggleCollapsed();
                  setExpandedSection('public-exams');
                } else {
                  setExpandedSection((prev) => (prev === 'public-exams' ? null : 'public-exams'));
                }
              }}
            >
              <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faClipboard} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{t('nav.concursos')}</span>
                  <FontAwesomeIcon
                    className={`w-3 h-3 transition-transform duration-200 ${expandedSection === 'public-exams' ? 'rotate-180' : ''}`}
                    icon={faChevronDown}
                  />
                </>
              )}
            </button>
            {!collapsed && expandedSection === 'public-exams' && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {CONCURSO_ITEMS.map((item) => (
                  <NextLink
                    key={item.href}
                    className={subItemClass(pathname === item.href)}
                    href={item.href}
                    onClick={closeDrawer}
                  >
                    <FontAwesomeIcon className="w-3 h-3 shrink-0" icon={item.icon} />
                    {t(item.labelKey)}
                  </NextLink>
                ))}
              </div>
            )}
          </>
        )}

        {/* Admin */}
        {status === 'authenticated' && session?.user?.plan === 'admin' && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1">
                <p className="px-3 font-mono text-xs text-default-400 uppercase tracking-widest">
                  {t('nav.settings')}
                </p>
              </div>
            )}
            {collapsed && <div className="pt-3" />}
            <NextLink
              className={navLinkClass(isAdminScope, collapsed)}
              href="/admin"
              title={collapsed ? 'Admin' : undefined}
              onClick={closeDrawer}
            >
              <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faGear} />
              {!collapsed && 'Admin'}
            </NextLink>
          </>
        )}
      </nav>
    );
  }

  function renderUsageCounters() {
    if (!usage || isCollapsed) return null;

    const questionsUnlimited = usage.questionsLimit === -1;
    const certsUnlimited = usage.certificationsLimit === -1;
    const examsUnlimited = usage.publicExamsLimit === -1;

    return (
      <div className="border-t border-divider px-4 py-4 flex flex-col gap-3 shrink-0">
        {/* Questions counter */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-default-400">{t('sidebar.questionsUsed')}</span>
            <span className="text-xs font-medium text-foreground">
              {questionsUnlimited ? '∞' : `${usage.questionsUsed}/${usage.questionsLimit}`}
            </span>
          </div>
          {!questionsUnlimited && (
            <div className="w-full h-1 bg-default-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usage.questionsUsed / usage.questionsLimit > 0.9
                    ? 'bg-danger'
                    : usage.questionsUsed / usage.questionsLimit > 0.7
                      ? 'bg-warning'
                      : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, Math.round((usage.questionsUsed / usage.questionsLimit) * 100))}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-default-400">{t('sidebar.questionsGenerated', { count: usage.questionsUsed })}</span>
            <span className="text-xs text-default-400">{t('sidebar.questionsSavedInLibrary', { count: usage.questionsSavedInLibrary })}</span>
          </div>
        </div>

        {/* Certifications counter */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400">{t('sidebar.certificationsUsed')}</span>
          <span className="text-xs font-medium text-foreground">
            {certsUnlimited ? '∞' : `${usage.certificationsUsed}/${usage.certificationsLimit}`}
          </span>
        </div>

        {/* Public exams counter (only when user has access) */}
        {usage.publicExamsLimit !== 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-default-400">{t('sidebar.publicExamsUsed')}</span>
            <span className="text-xs font-medium text-foreground">
              {examsUnlimited ? '∞' : `${usage.publicExamsUsed}/${usage.publicExamsLimit}`}
            </span>
          </div>
        )}
      </div>
    );
  }
}
