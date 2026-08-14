import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

const BAR_HEIGHTS = [40, 52, 58, 64, 68, 76, 88, 100] as const;

export function ProgressSection() {
  return (
    <section className="py-20 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="kick mb-2">Evolução</span>
            <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-6 leading-tight">
              Acompanhe seu progresso semana a semana
            </h2>
            <p className="text-mkt-text opacity-60 mb-4 leading-relaxed">
              Cada sessão de estudo alimenta seu histórico de acertos por tópico. Você vê onde evoluiu e onde ainda precisa de reforço.
            </p>
            <p className="text-mkt-text opacity-60 leading-relaxed">
              O diagnóstico direciona a geração das próximas questões — mais peso onde o desempenho ainda não atingiu a meta.
            </p>
          </div>

          <div className="blueprint bg-mkt-surface">
            <BlueprintCorners />
            <div className="flex items-center justify-between px-5 py-3 border-b border-mkt-divider">
              <span className="kick">Evolução · últimas 8 semanas</span>
              <span className="mono text-xs text-mkt-accent">+6,2 p.p. / semana</span>
            </div>

            <div className="px-5 pt-5 pb-3">
              <div className="flex items-end gap-2 h-24">
                {BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-mkt-accent"
                    style={{ height: `${h}%`, opacity: 0.4 + (i / BAR_HEIGHTS.length) * 0.6 }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="mono text-[10px] text-mkt-text opacity-40">SEM 1</span>
                <span className="mono text-[10px] text-mkt-text opacity-40">SEM 8</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px bg-mkt-divider mt-1">
              <div className="bg-mkt-surface px-3 py-3 text-center">
                <p className="mono text-sm font-medium text-mkt-text">78,4%</p>
                <p className="kick mt-0.5" style={{ fontSize: 9 }}>Acerto atual</p>
              </div>
              <div className="bg-mkt-surface px-3 py-3 text-center">
                <p className="mono text-sm font-medium" style={{ color: 'var(--color-accent)' }}>82,1%</p>
                <p className="kick mt-0.5" style={{ fontSize: 9 }}>Projeção</p>
              </div>
              <div className="bg-mkt-surface px-3 py-3 text-center">
                <p className="mono text-sm font-medium text-mkt-text opacity-60">72%</p>
                <p className="kick mt-0.5" style={{ fontSize: 9 }}>Linha de aprovação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
