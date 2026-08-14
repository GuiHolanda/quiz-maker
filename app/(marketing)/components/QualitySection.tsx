export function QualitySection() {
  return (
    <section className="py-16 bg-[var(--color-surface)] border-t border-[var(--color-divider)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div>
            <span className="kick mb-2">Geração e verificação</span>
            <h2 className="ds-heading text-[var(--color-text)] text-2xl mt-2 leading-tight">
              Como as questões são geradas e verificadas
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="ds-heading text-[var(--color-text)] text-base mb-1">
                Base: conteúdo programático público
              </h3>
              <p className="text-sm text-[var(--color-text)] opacity-55 leading-relaxed">
                As questões são geradas a partir dos editais, guias de certificação e conteúdos programáticos oficiais de cada exame. Nenhuma questão é copiada de prova anterior.
              </p>
            </div>
            <div>
              <h3 className="ds-heading text-[var(--color-text)] text-base mb-1">
                Pipeline de validação
              </h3>
              <p className="text-sm text-[var(--color-text)] opacity-55 leading-relaxed">
                Cada questão gerada passa por verificação automática de consistência: gabarito único, distratores plausíveis e alinhamento ao domínio do exame.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="ds-heading text-[var(--color-text)] text-base mb-1">
                Revisão humana disponível
              </h3>
              <p className="text-sm text-[var(--color-text)] opacity-55 leading-relaxed">
                Questões selecionadas por especialistas são marcadas como revisadas. O volume gerado por IA é indicado com transparência na interface.
              </p>
            </div>
            <div>
              <h3 className="ds-heading text-[var(--color-text)] text-base mb-1">
                Correção reportável
              </h3>
              <p className="text-sm text-[var(--color-text)] opacity-55 leading-relaxed">
                Encontrou um erro? Reporte diretamente na questão. O feedback alimenta a melhoria contínua do pipeline de geração.
              </p>
            </div>
          </div>
        </div>

        <p className="border-t border-[var(--color-divider)] mt-8 pt-6 text-xs text-[var(--color-text)] opacity-40 leading-relaxed">
          As questões geradas pela Certifique AI são produzidas por inteligência artificial com base em conteúdo programático público e não substituem material oficial das bancas examinadoras. Recomendamos uso complementar ao estudo tradicional.
        </p>
      </div>
    </section>
  );
}
