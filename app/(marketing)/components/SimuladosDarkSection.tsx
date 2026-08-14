import NextLink from 'next/link';

import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

const DOMAIN_ROWS = [
  { label: 'Redes e Armazenamento', count: '18 questões' },
  { label: 'Computação e Serverless', count: '22 questões' },
  { label: 'Segurança e IAM', count: '15 questões' },
] as const;

export function SimuladosDarkSection() {
  return (
    <section className="py-20" style={{ background: '#162232' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span
              className="kick mb-2"
            >
              Simulados
            </span>
            <h2 className="ds-heading text-4xl text-white mt-2 mb-4 leading-tight">
              O ensaio completo, no formato e no tempo da prova.
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Resolva um simulado completo com cronômetro, distribuição por matéria e gabarito comentado. Idêntico ao que você vai encontrar na prova real.
            </p>
            <NextLink
              className="inline-flex items-center text-sm font-semibold bg-mkt-accent text-white px-6 py-3 hover:opacity-90 transition-opacity"
              href="/register"
            >
              Criar conta e simular
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

            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(89,128,166,0.2)' }}>
              <span className="kick">Simulado · AWS SAA-C03</span>
              <span className="mono text-xs text-white/40">01:42:07</span>
            </div>

            <div className="px-5 py-4">
              <div className="h-1 w-full rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full w-2/3 rounded-full" style={{ background: 'rgba(89,128,166,0.6)' }} />
              </div>

              <div className="flex flex-col gap-3">
                {DOMAIN_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: 'rgba(89,128,166,0.15)' }}
                  >
                    <span className="text-sm text-white/70">{row.label}</span>
                    <span className="mono text-xs text-mkt-accent">{row.count}</span>
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
