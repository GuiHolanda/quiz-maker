import type { ExamLandingConfig } from '@/shared/types';
import { DemoQuizFlow } from './DemoQuizFlow';

interface DemoSimuladoSectionProps {
  readonly config: ExamLandingConfig;
}

export function DemoSimuladoSection({ config }: DemoSimuladoSectionProps) {
  return (
    <section id="demo-simulado" className="scroll-mt-20 py-16 bg-content2 border-y border-divider">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="font-mono text-xs text-default-500 uppercase tracking-widest">Simulado gratuito</span>
          <h2 className="font-sora font-bold text-foreground text-2xl sm:text-3xl mt-2">
            Experimente agora - sem cadastro
          </h2>
          <p className="text-default-500 text-sm mt-3 max-w-md mx-auto">
            20 questões {config.name} geradas por IA. Veja onde você está antes de se inscrever.
          </p>
        </div>

        <div className="bg-content1 border border-divider rounded-xl p-6 sm:p-8">
          <DemoQuizFlow config={config} />
        </div>
      </div>
    </section>
  );
}
