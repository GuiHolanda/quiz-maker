'use client';

import { useEffect, useState } from 'react';

const TERMINAL_AWS_QUESTION =
  'A company is designing a highly available web application on AWS. The application requires session persistence, automatic failover across Availability Zones, and the ability to handle traffic spikes of up to 10x normal load within 60 seconds. Which combination of services BEST meets these requirements?';

const TERMINAL_AWS_OPTIONS = [
  { label: 'A', text: 'Use Amazon S3 Cross-Region Replication with S3-IA storage class for infrequent access patterns', selected: false },
  { label: 'B', text: 'Deploy a Multi-AZ RDS instance with read replicas and ElastiCache for session management', selected: true },
  { label: 'C', text: 'Configure AWS Global Accelerator with an ALB and Auto Scaling group across two Availability Zones', selected: false },
  { label: 'D', text: 'Implement AWS Direct Connect with a VPN backup and Transit Gateway for hybrid connectivity', selected: false },
] as const;

const TERMINAL_CESPE_QUESTION =
  'Acerca dos princípios da Administração Pública previstos no art. 37 da Constituição Federal de 1988, julgue o item a seguir. O princípio da eficiência, introduzido pela Emenda Constitucional n.º 19/1998, impõe ao agente público o dever de realizar suas atribuições com presteza, perfeição e rendimento funcional, podendo a Administração demitir servidor estável por insuficiência de desempenho mediante processo administrativo.';

const TERMINAL_CESPE_OPTIONS = [
  { label: 'C', text: 'Certo', selected: true },
  { label: 'E', text: 'Errado', selected: false },
] as const;

export function TerminalDemo() {
  const [terminalTab, setTerminalTab] = useState<'aws' | 'cespe'>('aws');
  const [displayedText, setDisplayedText] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const activeQuestion = terminalTab === 'aws' ? TERMINAL_AWS_QUESTION : TERMINAL_CESPE_QUESTION;
  const activeOptions = terminalTab === 'aws' ? TERMINAL_AWS_OPTIONS : TERMINAL_CESPE_OPTIONS;

  useEffect(() => {
    setDisplayedText('');
    setShowOptions(false);
    let interval: ReturnType<typeof setInterval>;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayedText(activeQuestion);
      setShowOptions(true);
      return;
    }
    let i = 0;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        if (i < activeQuestion.length) {
          setDisplayedText(activeQuestion.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowOptions(true), 300);
        }
      }, 18);
    }, 600);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [terminalTab, activeQuestion]);

  return (
    <div className="relative" id="demo-terminal">
      <div className="border border-navy-700 rounded-lg overflow-hidden bg-navy-950/80">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-800 bg-navy-900/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-xs text-navy-400">certifyai · question-generator</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={terminalTab === 'aws'}
              onClick={() => setTerminalTab('aws')}
              className={`font-mono text-xs px-2 py-0.5 rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${terminalTab === 'aws' ? 'bg-navy-700 text-white' : 'text-navy-500 hover:text-navy-300'}`}
            >
              IT
            </button>
            <button
              type="button"
              aria-pressed={terminalTab === 'cespe'}
              onClick={() => setTerminalTab('cespe')}
              className={`font-mono text-xs px-2 py-0.5 rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${terminalTab === 'cespe' ? 'bg-navy-700 text-white' : 'text-navy-500 hover:text-navy-300'}`}
            >
              Concurso
            </button>
          </div>
        </div>

        {/* Terminal body */}
        <div className="p-5 min-h-72">
          <div className="mb-3">
            <span className="font-mono text-xs text-navy-600">$</span>
            <span className="font-mono text-xs text-navy-400 ml-2">
              {terminalTab === 'aws'
                ? 'generate --exam aws-saa-c03 --difficulty hard --topic "architecture"'
                : 'generate --banca cespe --cargo "Analista Judiciário" --disciplina "Direito Administrativo"'}
            </span>
          </div>
          <div className="font-mono text-xs text-accent mb-2">
            {terminalTab === 'aws'
              ? '✓ Generating AWS Solutions Architect question...'
              : '✓ Gerando questão CESPE · Direito Administrativo...'}
          </div>

          <div className="bg-accent/5 rounded px-4 py-3 mt-4">
            <p className="font-mono text-xs text-navy-400 mb-2 uppercase tracking-widest">
              {terminalTab === 'aws'
                ? 'QUESTION #4,891 · AWS-SAA-C03 · HARD'
                : 'QUESTÃO #2,107 · CESPE/CEBRASPE · DIR. ADMINISTRATIVO'}
            </p>
            <p className="font-mono text-sm text-white leading-relaxed break-words">
              {displayedText}
              {displayedText.length < activeQuestion.length && <span className="text-accent">▌</span>}
            </p>
          </div>

          {showOptions && (
            <div className="mt-5 space-y-2">
              {activeOptions.map((opt) => (
                <div
                  key={opt.label}
                  className={`flex items-start gap-3 p-2.5 border rounded transition-colors ${
                    opt.selected ? 'border-accent/30 bg-accent/5' : 'border-navy-800 hover:border-navy-600'
                  }`}
                >
                  <span className={`font-mono text-xs mt-0.5 w-4 shrink-0 ${opt.selected ? 'text-accent' : 'text-navy-500'}`}>
                    {opt.label}.
                  </span>
                  <span className={`font-mono text-xs ${opt.selected ? 'text-white' : 'text-navy-300'}`}>
                    {opt.text}
                  </span>
                </div>
              ))}

              <div className="mt-4 pt-3 border-t border-navy-800 flex items-center gap-4">
                {terminalTab === 'aws' ? (
                  <>
                    <span className="font-mono text-xs text-navy-600">Difficulty:</span>
                    <span className="font-mono text-xs text-orange-400">HARD</span>
                    <span className="font-mono text-xs text-navy-600">Domain:</span>
                    <span className="font-mono text-xs text-navy-300">High Availability</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs text-navy-600">Banca:</span>
                    <span className="font-mono text-xs text-orange-400">CESPE</span>
                    <span className="font-mono text-xs text-navy-600">Matéria:</span>
                    <span className="font-mono text-xs text-navy-300">Dir. Administrativo</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full pointer-events-none bg-accent/[0.08] blur-lg" />
    </div>
  );
}
