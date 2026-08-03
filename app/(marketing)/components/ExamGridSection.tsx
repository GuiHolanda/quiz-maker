'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faLandmark,
  faBuilding,
  faScaleBalanced,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';
import { faAws, faMicrosoft } from '@fortawesome/free-brands-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const IT_TRACKS = [
  {
    icon: faAws,
    provider: 'Amazon Web Services',
    title: 'AWS',
    tracks: ['SAA-C03 · Solutions Architect', 'DVA-C02 · Developer', 'SOA-C02 · SysOps Admin', '+ 8 more tracks'],
    count: '340K+ questions',
    href: '/register',
  },
  {
    icon: faMicrosoft,
    provider: 'Microsoft Azure',
    title: 'Azure',
    tracks: ['AZ-900 · Fundamentals', 'AZ-104 · Administrator', 'AZ-305 · Solutions Expert', '+ 6 more tracks'],
    count: '280K+ questions',
    href: '/register',
  },
  {
    icon: faBuilding,
    provider: 'SAP Enterprise',
    title: 'SAP',
    tracks: ['C_HANATEC · Technology', 'C_S4FTR · Finance', 'P_SAPEA · Enterprise Arch', '+ 5 more tracks'],
    count: '190K+ questions',
    href: '/register',
  },
] as const;

const CONCURSO_BANCAS = [
  { name: 'CESPE / CEBRASPE', note: 'Federal — INSS, PRF, PF, TCU' },
  { name: 'FCC', note: 'Tribunais, Receita Federal' },
  { name: 'FGV', note: 'Judiciário, Prefeituras' },
  { name: 'IBFC', note: 'Saúde, Segurança, Educação' },
  { name: 'VUNESP', note: 'SP — TJ, Câmaras, SABESP' },
  { name: 'CEBRASPE · Delegado', note: 'PC, Civil, Federal' },
] as const;

const CONCURSO_AREAS = [
  { icon: faScaleBalanced, label: 'Direito e OAB' },
  { icon: faLandmark, label: 'Administrativo' },
  { icon: faBuilding, label: 'Saúde · COREN · CRM' },
  { icon: faFileLines, label: 'Contabilidade · CFC' },
] as const;

export function ExamGridSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-px h-4 bg-accent" />
            <span className="font-mono text-xs text-navy-400 tracking-widest uppercase">
              {t('homepage.examGrid.sectionLabel')}
            </span>
          </div>
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl mb-3">{t('homepage.examGrid.title')}</h2>
          <p className="text-navy-400 text-base max-w-xl">{t('homepage.examGrid.subtitle')}</p>
        </div>

        {/* Featured: Concursos Públicos */}
        <NextLink href="/register" className="block group mb-4">
          <div className="border border-accent/20 rounded-lg p-6 bg-navy-950/60 hover:bg-navy-950/80 transition-colors duration-200 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,212,255,0.02)' }} />
            <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {/* Left: identity */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-accent/30 group-hover:border-accent/60 rounded flex items-center justify-center transition-colors duration-200 shrink-0">
                    <FontAwesomeIcon className="text-accent text-lg" icon={faLandmark} />
                  </div>
                  <div>
                    <span className="font-mono text-xs text-navy-400 uppercase tracking-widest block">
                      {t('homepage.examGrid.concursoProvider')}
                    </span>
                    <h3 className="font-sora font-bold text-white text-xl leading-tight">Concursos Públicos</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-sm text-accent font-medium">
                    {t('homepage.examGrid.concursoQuestions')}
                  </span>
                  <span className="font-mono text-xs text-navy-600">· {t('homepage.examGrid.concursoBancas')}</span>
                </div>
              </div>

              {/* Middle: bancas */}
              <div className="lg:col-span-1">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-3">
                  {t('homepage.examGrid.concursoBancasLabel')}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {CONCURSO_BANCAS.map((b) => (
                    <div key={b.name}>
                      <span className="font-mono text-xs text-navy-300 block leading-snug">{b.name}</span>
                      <span className="font-mono text-xs text-navy-600 block leading-snug">{b.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: areas */}
              <div className="lg:col-span-1">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-3">
                  {t('homepage.examGrid.concursoAreasLabel')}
                </p>
                <div className="space-y-2">
                  {CONCURSO_AREAS.map((area) => (
                    <div key={area.label} className="flex items-center gap-2">
                      <FontAwesomeIcon className="text-navy-500 text-xs w-3 shrink-0" icon={area.icon} />
                      <span className="text-sm text-navy-300">{area.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm text-navy-500">+ Informática, Raciocínio Lógico, Português...</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-5 pt-4 border-t border-navy-800/60 flex items-center justify-between">
              <span className="text-xs text-navy-500">{t('homepage.examGrid.concursoCta')}</span>
              <FontAwesomeIcon
                className="text-xs text-accent group-hover:translate-x-1 transition-transform duration-200"
                icon={faArrowRight}
              />
            </div>
          </div>
        </NextLink>

        {/* IT certifications row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {IT_TRACKS.map((track) => (
            <NextLink key={track.title} href={track.href} className="block group">
              <div className="border border-navy-700/60 rounded-lg p-5 bg-navy-950/40 hover:bg-navy-950/70 transition-colors duration-200 relative overflow-hidden h-full">
                <div className="w-10 h-10 border border-navy-700 group-hover:border-accent/40 rounded flex items-center justify-center mb-4 transition-colors duration-200">
                  <FontAwesomeIcon
                    className="text-navy-400 group-hover:text-accent text-lg transition-colors duration-200"
                    icon={track.icon}
                  />
                </div>
                <div className="mb-1">
                  <span className="font-mono text-xs text-navy-500 uppercase tracking-widest">{track.provider}</span>
                </div>
                <h3 className="font-sora font-semibold text-white text-base mb-3">{track.title}</h3>
                <div className="space-y-1 mb-4">
                  {track.tracks.map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-navy-600 shrink-0" />
                      <span className="font-mono text-xs text-navy-400">{name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-mono text-xs text-accent">{track.count}</span>
                  <FontAwesomeIcon
                    className="text-xs text-navy-600 group-hover:text-accent transition-colors duration-200"
                    icon={faArrowRight}
                  />
                </div>
              </div>
            </NextLink>
          ))}
        </div>
      </div>
    </section>
  );
}
