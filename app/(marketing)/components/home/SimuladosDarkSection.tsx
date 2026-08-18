'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const DOMAIN_ROWS = [
  { key: 'row1', count: 18 },
  { key: 'row2', count: 22 },
  { key: 'row3', count: 15 },
] as const;

export function SimuladosDarkSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20" style={{ background: '#162232' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="kick mb-2">{t('homepage.simulados.kick')}</span>
            <h2 className="ds-heading text-4xl text-white mt-2 mb-4 leading-tight text-balance">
              {t('homepage.simulados.title')}
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed text-pretty">{t('homepage.simulados.body')}</p>
            <NextLink
              className="inline-flex items-center text-sm font-semibold bg-mkt-accent text-white px-6 py-3 hover:opacity-90 transition-opacity"
              href="/register"
            >
              {t('homepage.simulados.cta')}
            </NextLink>
          </div>

          <div
            className="relative border overflow-visible"
            style={{
              background: '#0d1a27',
              borderColor: 'rgba(89,128,166,0.3)',
              borderRadius: 0,
            }}
          >
            <span className="corner tl" style={{ color: 'rgba(89,128,166,0.5)' }} />
            <span className="corner tr" style={{ color: 'rgba(89,128,166,0.5)' }} />
            <span className="corner bl" style={{ color: 'rgba(89,128,166,0.5)' }} />
            <span className="corner br" style={{ color: 'rgba(89,128,166,0.5)' }} />

            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'rgba(89,128,166,0.2)' }}
            >
              <span className="kick">{t('homepage.simulados.panelLabel')}</span>
              <span className="mono text-xs text-white/40">01:42:07</span>
            </div>

            <div className="px-5 py-4">
              <div className="h-1 w-full rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full w-2/3 rounded-full" style={{ background: 'rgba(89,128,166,0.6)' }} />
              </div>

              <div className="flex flex-col gap-3">
                {DOMAIN_ROWS.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: 'rgba(89,128,166,0.15)' }}
                  >
                    <span className="text-sm text-white/70">{t(`homepage.simulados.${row.key}`)}</span>
                    <span className="mono text-xs text-mkt-accent">
                      {t('homepage.simulados.questionCount', { n: row.count })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
