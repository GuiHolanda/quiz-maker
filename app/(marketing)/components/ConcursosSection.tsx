'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

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
  { titleKey: 'homepage.concursos.flow.step1Title', bodyKey: 'homepage.concursos.flow.step1Body' },
  { titleKey: 'homepage.concursos.flow.step2Title', bodyKey: 'homepage.concursos.flow.step2Body' },
  { titleKey: 'homepage.concursos.flow.step3Title', bodyKey: 'homepage.concursos.flow.step3Body' },
  { titleKey: 'homepage.concursos.flow.step4Title', bodyKey: 'homepage.concursos.flow.step4Body' },
] as const;

export function ConcursosSection() {
  const { t } = useTranslation();

  return (
    <section id="concursos" className="scroll-mt-24 py-20 bg-mkt-surface border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('homepage.concursos.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mb-3">{t('homepage.concursos.title')}</h2>
        <p className="text-mkt-text opacity-60 text-base max-w-2xl mb-12">{t('homepage.concursos.subtitle')}</p>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 blueprint bg-mkt-bg p-6">
            <BlueprintCorners />
            <span className="kick mb-3">{t('homepage.concursos.bancasLabel')}</span>
            <h3 className="ds-heading text-mkt-text text-lg mb-2">{t('homepage.concursos.whyTitle')}</h3>
            <p className="text-sm text-mkt-text opacity-55 leading-relaxed mb-6">{t('homepage.concursos.whyBody')}</p>

            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {BANCAS.map((banca) => (
                <div
                  key={banca.name}
                  className="border-b border-mkt-divider pb-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <dt className="text-sm text-mkt-text font-medium">{banca.name}</dt>
                    <dd className="kick shrink-0">{banca.format}</dd>
                  </div>
                  <dd className="text-xs text-mkt-text opacity-50">{banca.scope}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-2 blueprint bg-mkt-accent-100 border-mkt-accent p-6 flex flex-col">
            <BlueprintCorners />
            <span className="kick mb-5">{t('homepage.concursos.flowLabel')}</span>
            <ol className="flex-1 flex flex-col">
              {FLOW_STEPS.map((step, i) => {
                const isLast = i === FLOW_STEPS.length - 1;
                return (
                  <li key={step.titleKey} className={`flex gap-4 ${isLast ? '' : 'flex-1'}`}>
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-7 h-7 flex items-center justify-center bg-mkt-bg border border-mkt-divider shrink-0">
                        <span className="mono text-xs text-mkt-accent font-semibold">{i + 1}</span>
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-mkt-divider my-2" />}
                    </div>
                    <div className={isLast ? '' : 'pb-6'}>
                      <h4 className="ds-heading text-sm text-mkt-text mb-1">{t(step.titleKey)}</h4>
                      <p className="text-xs text-mkt-text opacity-55 leading-relaxed">{t(step.bodyKey)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="mt-4 blueprint bg-mkt-bg px-6 py-5">
          <BlueprintCorners />
          <span className="kick mb-3">{t('homepage.concursos.areasLabel')}</span>
          <div className="flex flex-wrap gap-2 mt-3">
            {AREAS.map((area) => (
              <span
                key={area}
                className="text-xs text-mkt-text opacity-65 px-2.5 py-1 border border-mkt-divider bg-mkt-surface"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <NextLink
          className="inline-flex items-center text-sm font-semibold bg-mkt-accent text-white px-6 py-3 mt-10 hover:opacity-90 transition-opacity"
          href="/register"
        >
          {t('homepage.concursos.cta')}
        </NextLink>
      </div>
    </section>
  );
}
