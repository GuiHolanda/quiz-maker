import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

const BAR_HEIGHTS = [40, 52, 58, 64, 68, 76, 88, 100] as const;

export function ProgressSection() {
  return (
    <section className="py-20 bg-[var(--color-bg)] border-t border-[var(--color-divider)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="kick mb-2">Evolução</span>
            <h2 className="ds-heading text-[var(--color-text)] text-3xl mt-1 mb-6 leading-tight">
              Acompanhe seu progresso semana a semana
            </h2>
            <p className="text-[var(--color-text)] opacity-60 mb-4 leading-relaxed">
              Cada sessão de estudo alimenta seu histórico de acertos por tópico. Você vê onde evoluiu e onde ainda precisa de reforço.
            </p>
            <p className="text-[var(--color-text)] opacity-60 leading-relaxed">
              O diagnóstico direciona a geração das próximas questões — mais peso onde o desempenho ainda não atingiu a meta.
            </p>
          </div>

          <div className="blueprint bg-[var(--color-surface)]">
            <BlueprintCorners />
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-divider)]">
              <span className="kick">Evolução · últimas 8 semanas</span>
              <span className="mono text-xs text-[var(--color-accent)]">+6,2 p.p. / semana</span>
            </div>

            <div className="px-5 pt-5 pb-3">
              <div className="flex items-end gap-2 h-24">
                {BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[var(--color-accent)]"
                    style={{ height: `${h}%`, opacity: 0.4 + (i / BAR_HEIGHTS.length) * 0.6 }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="mono text-[10px] text-[var(--color-text)] opacity-40">SEM 1</span>
                <span className="mono text-[10px] text-[var(--color-text)] opacity-40">SEM 8</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px bg-[var(--color-divider)] mt-1">
              <div className="bg-[var(--color-surface)] px-3 py-3 text-center">
                <p className="mono text-sm font-medium text-[var(--color-text)]">78,4%</p>
                <p className="kick mt-0.5" style={{ fontSize: 9 }}>Acerto atual</p>
              </div>
              <div className="bg-[var(--color-surface)] px-3 py-3 text-center">
                <p className="mono text-sm font-medium" style={{ color: 'var(--color-accent)' }}>82,1%</p>
                <p className="kick mt-0.5" style={{ fontSize: 9 }}>Projeção</p>
              </div>
              <div className="bg-[var(--color-surface)] px-3 py-3 text-center">
                <p className="mono text-sm font-medium text-[var(--color-text)] opacity-60">72%</p>
                <p className="kick mt-0.5" style={{ fontSize: 9 }}>Linha de aprovação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
