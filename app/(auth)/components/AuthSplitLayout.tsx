'use client';

import { MotionConfig } from 'framer-motion';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface AuthBrandPanelProps {
  readonly page: 'login' | 'register';
}

export function AuthBrandPanel({ page }: AuthBrandPanelProps) {
  const { t } = useTranslation();

  const titleStart = page === 'register' ? t('register.brandTitleStart') : t('login.brandTitleStart');
  const titleAccent = page === 'register' ? t('register.brandTitleAccent') : t('login.brandTitleAccent');
  const subtitle = page === 'register' ? t('register.brandSubtitle') : t('login.brandSubtitle');

  return (
    <section className="hidden lg:flex bg-[#070e20] border-r border-white/[0.06] text-foreground p-12 xl:p-16 flex-col justify-center relative overflow-hidden">
      <div className="flex flex-col gap-8 max-w-xl">
        <h2 className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05] text-wrap-balance">
          {titleStart} <span className="text-primary">{titleAccent}</span>
        </h2>
        <p className="text-base xl:text-lg text-default-400 max-w-md leading-relaxed">{subtitle}</p>
        <CertBadgesIllustration />
      </div>
    </section>
  );
}

function BrandMark() {
  return (
    <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 28 28">
      <rect fill="#e07820" height="28" rx="6" width="28" />
      <path d="M8 14.5L12 18.5L20 9.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
}

function CertBadgesIllustration() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="flex gap-3">
        {['AWS', 'OAB', 'CRM', 'Azure'].map((label) => (
          <div key={label} className="h-8 rounded-md bg-white/8 border border-white/10 px-3 flex items-center">
            <span className="text-default-400 text-xs font-semibold">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {['CFP', 'CREA', 'Concursos'].map((label) => (
          <div key={label} className="h-8 rounded-md bg-white/8 border border-white/10 px-3 flex items-center">
            <span className="text-default-400 text-xs font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AuthSplitLayoutProps {
  readonly children: React.ReactNode;
  readonly page: 'login' | 'register';
}

export function AuthSplitLayout({ children, page }: AuthSplitLayoutProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="grid lg:grid-cols-2 min-h-screen">
        <AuthBrandPanel page={page} />
        <section className="flex items-center justify-center px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
          <div className="w-full max-w-sm">{children}</div>
        </section>
      </div>
    </MotionConfig>
  );
}
