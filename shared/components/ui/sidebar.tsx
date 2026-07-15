'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from '@heroui/drawer';
import { Avatar } from '@heroui/avatar';
import NextLink from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
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

function navLinkClass(isActive: boolean) {
  return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
    isActive
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-default-500 hover:text-foreground hover:bg-default-100'
  }`;
}

function sectionHeaderClass(isActive: boolean) {
  return `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
    isActive
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-default-500 hover:text-foreground hover:bg-default-100'
  }`;
}

function subItemClass(isActive: boolean) {
  return `flex items-center gap-3 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-colors duration-200 ${
    isActive ? 'text-primary font-semibold' : 'text-default-400 hover:text-foreground hover:bg-default-100'
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
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);

  useEffect(() => {
    if (isCertificationsScope) setExpandedSection('certifications');
    else if (isConcursosScope) setExpandedSection('public-exams');
  }, []);

  const showConcursos = !usage || usage.publicExamsLimit !== 0;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col bg-background2 border-r border-divider overflow-y-auto">
        {renderBrand()}
        <div className="flex-1 overflow-y-auto py-3 px-3">{renderNav()}</div>
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
          <p className="font-bold text-foreground tracking-wide text-sm">Certifique AI</p>
        </NextLink>
        <Avatar
          classNames={{ base: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-transparent cursor-pointer' }}
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
              <p className="font-bold text-foreground tracking-wide text-sm">Certifique AI</p>
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
      <div className="h-14 flex items-center gap-3 px-4 border-b border-divider shrink-0">
        <NextLink className="flex items-center gap-2" href="/">
          <Image alt="CertifiqueAI" className="rounded-md" height={22} src="/icon.svg" width={22} />
          <p className="font-bold text-foreground tracking-wide text-sm">Certifique AI</p>
        </NextLink>
      </div>
    );
  }

  function renderNav(isMobile = false) {
    const closeDrawer = isMobile ? () => setIsMobileOpen(false) : undefined;

    return (
      <nav className="flex flex-col gap-0.5">
        {/* Dashboard */}
        <NextLink className={navLinkClass(pathname === '/dashboard')} href="/dashboard" onClick={closeDrawer}>
          <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faHouse} />
          {t('nav.dashboard')}
        </NextLink>

        {/* Certifications section */}
        <button
          className={sectionHeaderClass(isCertificationsScope)}
          onClick={() => setExpandedSection((prev) => (prev === 'certifications' ? null : 'certifications'))}
        >
          <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faGraduationCap} />
          <span className="flex-1 text-left">{t('nav.certificates')}</span>
          <FontAwesomeIcon
            className={`w-3 h-3 transition-transform duration-200 ${expandedSection === 'certifications' ? 'rotate-180' : ''}`}
            icon={faChevronDown}
          />
        </button>
        {expandedSection === 'certifications' && (
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
              className={sectionHeaderClass(isConcursosScope)}
              onClick={() => setExpandedSection((prev) => (prev === 'public-exams' ? null : 'public-exams'))}
            >
              <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faClipboard} />
              <span className="flex-1 text-left">{t('nav.concursos')}</span>
              <FontAwesomeIcon
                className={`w-3 h-3 transition-transform duration-200 ${expandedSection === 'public-exams' ? 'rotate-180' : ''}`}
                icon={faChevronDown}
              />
            </button>
            {expandedSection === 'public-exams' && (
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
            <div className="pt-4 pb-1">
              <p className="px-3 text-xs font-semibold text-default-400 uppercase tracking-wider">
                {t('nav.settings')}
              </p>
            </div>
            <NextLink className={navLinkClass(isAdminScope)} href="/admin" onClick={closeDrawer}>
              <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={faGear} />
              Admin
            </NextLink>
          </>
        )}
      </nav>
    );
  }

  function renderUsageCounters() {
    if (!usage) return null;

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
