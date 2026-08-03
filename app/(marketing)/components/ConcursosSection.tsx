'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faLandmark, faFileLines, faSitemap, faListCheck } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const BANCAS = [
  { name: 'CESPE / CEBRASPE', format: 'Certo / Errado', scope: 'PF, PRF, INSS, TCU, Depen' },
  { name: 'FGV', format: 'Múltipla escolha', scope: 'TJ, Senado, SEFAZ, Prefeituras' },
  { name: 'FCC', format: 'Múltipla escolha', scope: 'Tribunais, TRT, Metrô-SP' },
  { name: 'VUNESP', format: 'Múltipla escolha', scope: 'TJ-SP, PC-SP, SABESP, Câmaras' },
  { name: 'IBFC', format: 'Múltipla escolha', scope: 'Saúde, Educação, Segurança' },
  { name: 'Cebraspe · Delegado', format: 'Discursiva + itens', scope: 'PC, Polícia Federal, Civil' },
] as const;

const AREAS = [
  'Direito Constitucional e Administrativo',
  'Português e Redação Oficial',
  'Raciocínio Lógico e Matemática',
  'Informática e Legislação',
  'Contabilidade e Administração Pública',
  'Conhecimentos específicos por cargo',
] as const;

const FLOW_STEPS = [
  { icon: faFileLines, titleKey: 'homepage.concursos.flow.step1Title', bodyKey: 'homepage.concursos.flow.step1Body' },
  { icon: faSitemap, titleKey: 'homepage.concursos.flow.step2Title', bodyKey: 'homepage.concursos.flow.step2Body' },
  { icon: faListCheck, titleKey: 'homepage.concursos.flow.step3Title', bodyKey: 'homepage.concursos.flow.step3Body' },
] as const;

export function ConcursosSection() {
  const { t } = useTranslation();

  return (
    <section id="concursos" className="scroll-mt-24 py-20 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent/10 border border-accent/30 shrink-0">
            <FontAwesomeIcon className="text-accent text-base" icon={faLandmark} />
          </div>
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl text-balance">
            {t('homepage.concursos.title')}
          </h2>
        </div>
        <p className="text-navy-400 text-base max-w-2xl text-pretty mb-12">{t('homepage.concursos.subtitle')}</p>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* Why-by-banca narrative + bancas table */}
          <div className="lg:col-span-3 border border-navy-700/60 rounded-xl p-6 bg-navy-950/40">
            <h3 className="font-sora font-bold text-white text-lg mb-2">{t('homepage.concursos.whyTitle')}</h3>
            <p className="text-sm text-navy-300 leading-relaxed text-pretty mb-6">{t('homepage.concursos.whyBody')}</p>

            <p className="text-xs text-navy-400 font-medium mb-3">{t('homepage.concursos.bancasLabel')}</p>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {BANCAS.map((banca) => (
                <div
                  key={banca.name}
                  className="border-b border-navy-800/60 pb-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <dt className="text-sm text-white font-medium">{banca.name}</dt>
                    <dd className="text-xs text-accent shrink-0">{banca.format}</dd>
                  </div>
                  <dd className="text-xs text-navy-400">{banca.scope}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 3-step flow */}
          <div className="lg:col-span-2 flex flex-col border border-accent/20 rounded-xl p-6 bg-accent/5">
            <p className="text-xs text-navy-400 font-medium mb-5">{t('homepage.concursos.flowLabel')}</p>
            <ol className="flex-1 flex flex-col">
              {FLOW_STEPS.map((step, i) => {
                const isLast = i === FLOW_STEPS.length - 1;
                return (
                  <li key={step.titleKey} className={`flex gap-4 ${isLast ? '' : 'flex-1'}`}>
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy-950 border border-accent/30 shrink-0">
                        <span className="font-mono text-xs text-accent font-semibold">{i + 1}</span>
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-navy-700/60 my-2" />}
                    </div>
                    <div className={isLast ? '' : 'pb-6'}>
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon className="text-accent text-xs" icon={step.icon} />
                        <h4 className="text-sm text-white font-semibold">{t(step.titleKey)}</h4>
                      </div>
                      <p className="text-xs text-navy-400 leading-relaxed">{t(step.bodyKey)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Areas covered — full-width band below the grid */}
        <div className="mt-8 border border-navy-700/60 rounded-xl px-6 py-5 bg-navy-950/40">
          <p className="text-xs text-navy-400 font-medium mb-3">{t('homepage.concursos.areasLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <span
                key={area}
                className="text-xs text-navy-300 px-2.5 py-1 rounded-md border border-navy-700/60 bg-navy-900/60"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <Button
          as={NextLink}
          href="/register"
          size="lg"
          className="group mt-10 font-semibold text-sm bg-accent hover:bg-electric text-navy-950 rounded-lg transition-colors duration-200"
        >
          {t('homepage.concursos.cta')}
          <FontAwesomeIcon
            className="ml-1 text-xs group-hover:translate-x-1 transition-transform duration-200"
            icon={faArrowRight}
          />
        </Button>
      </div>
    </section>
  );
}
