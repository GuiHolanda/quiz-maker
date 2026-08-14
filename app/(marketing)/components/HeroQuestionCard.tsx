import NextLink from 'next/link';

import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

const OPTIONS = [
  { letter: 'A', text: 'Amazon S3 com Cross-Region Replication' },
  { letter: 'B', text: 'Amazon EFS', correct: true },
  { letter: 'C', text: 'Amazon EBS Multi-Attach' },
  { letter: 'D', text: 'AWS Storage Gateway' },
] as const;

export function HeroQuestionCard() {
  return (
    <div className="blueprint bg-[var(--color-bg)] overflow-visible">
      <BlueprintCorners />

      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-divider)]">
        <span className="kick">Geração de questões</span>
        <span className="mono text-[11px] text-[var(--color-text)] opacity-50">&lt;200ms por questão</span>
      </div>

      <div className="p-5">
        <span className="kick">Questão · AWS SAA-C03 · Armazenamento</span>
        <p className="ds-heading text-[var(--color-text)] text-lg mt-2 mb-5 leading-snug">
          Uma aplicação precisa de armazenamento compartilhado entre várias instâncias EC2 em Zonas de Disponibilidade diferentes. Qual serviço atende ao requisito?
        </p>

        <div className="flex flex-col gap-2">
          {OPTIONS.map((opt) => (
            <div
              key={opt.letter}
              className={
                opt.correct
                  ? 'flex items-center justify-between px-4 py-2.5 border border-[var(--color-accent)] bg-[var(--color-accent-100)] text-sm text-[var(--color-text)]'
                  : 'flex items-center px-4 py-2.5 border border-[var(--color-divider)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] opacity-60'
              }
            >
              <span>
                <span className="mono font-medium mr-2">{opt.letter}</span>
                {opt.text}
              </span>
              {opt.correct && <span className="kick ml-4 shrink-0">Correta</span>}
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-divider)] pt-4 mt-4">
          <p className="text-xs text-[var(--color-text)] opacity-55 leading-relaxed">
            EFS é um sistema de arquivos NFS gerenciado e elástico, acessível simultaneamente de múltiplas AZs. EBS Multi-Attach suporta apenas uma AZ; S3 não é sistema de arquivos; Storage Gateway é para ambientes on-premises.
          </p>
        </div>

        <NextLink
          className="block w-full text-center text-sm font-semibold bg-[var(--color-accent)] text-white py-2.5 mt-4 hover:opacity-90 transition-opacity"
          href="/register"
        >
          Gerar minhas questões grátis
        </NextLink>
      </div>
    </div>
  );
}
