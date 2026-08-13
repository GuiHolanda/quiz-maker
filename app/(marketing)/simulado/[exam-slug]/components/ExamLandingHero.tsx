'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

interface ExamLandingHeroProps {
  readonly config: ExamLandingConfig;
}

export function ExamLandingHero({ config }: ExamLandingHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="pt-16 pb-20 relative overflow-hidden">
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full pointer-events-none"
        style={{ background: 'rgba(224,120,32,0.06)', filter: 'blur(80px)' }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 border border-navy-700 rounded-full px-3 py-1 mb-8">
          <FontAwesomeIcon className="text-[#e07820] text-xs" icon={faBolt} />
          <span className="font-mono text-xs text-navy-400 uppercase tracking-widest">{config.provider}</span>
        </div>

        <h1 className="font-sora font-extrabold text-white text-3xl sm:text-4xl xl:text-5xl leading-tight mb-6 text-balance">
          {config.heroHeadline}
        </h1>

        <p className="text-navy-400 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto text-pretty">
          {config.heroSubheadline}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            className="font-semibold text-sm bg-[#e07820] hover:opacity-90 text-white rounded w-full sm:w-auto transition-opacity duration-200"
            href="#demo-simulado"
            as="a"
            size="lg"
          >
            {t('landing.hero.ctaPrimary')}
            <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowDown} />
          </Button>
          <Button
            as={NextLink}
            className="font-medium text-sm text-navy-400 hover:text-white border border-navy-700 hover:border-navy-600 rounded w-full sm:w-auto"
            href="/register"
            size="lg"
            variant="bordered"
          >
            {t('landing.hero.ctaSecondary')}
            <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
          </Button>
        </div>
      </div>
    </section>
  );
}
