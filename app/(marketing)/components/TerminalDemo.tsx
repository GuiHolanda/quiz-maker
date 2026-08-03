'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { faAws } from '@fortawesome/free-brands-svg-icons';
import { faScaleBalanced, faHeartPulse, faLandmark } from '@fortawesome/free-solid-svg-icons';

const DOMAINS = [
  {
    id: 'aws',
    icon: faAws,
    tab: 'AWS',
    area: 'Certificação · AWS SAA-C03',
    question:
      'Uma empresa precisa garantir alta disponibilidade para seu sistema web, com failover automático entre zonas e escalabilidade de 10x em picos de tráfego em menos de 60 segundos. Qual combinação de serviços AWS atende melhor?',
    options: [
      { label: 'A', text: 'S3 Cross-Region com armazenamento S3-IA', correct: false },
      { label: 'B', text: 'RDS Multi-AZ com ElastiCache para sessões', correct: true },
      { label: 'C', text: 'ALB + Auto Scaling em múltiplas AZs', correct: false },
      { label: 'D', text: 'Direct Connect com VPN de backup', correct: false },
    ],
    meta: { level: 'Difícil', topic: 'Alta Disponibilidade' },
  },
  {
    id: 'oab',
    icon: faScaleBalanced,
    tab: 'OAB / Direito',
    area: 'Concurso · Direito Administrativo',
    question:
      'O princípio da eficiência, introduzido pela EC nº 19/1998, impõe ao agente público o dever de realizar suas atribuições com presteza e rendimento funcional. Com base nisso, é correto afirmar que a Administração pode demitir servidor estável por insuficiência de desempenho mediante processo administrativo?',
    options: [
      { label: 'C', text: 'Certo', correct: true },
      { label: 'E', text: 'Errado', correct: false },
    ],
    meta: { level: 'Médio', topic: 'Princípios Constitucionais' },
  },
  {
    id: 'saude',
    icon: faHeartPulse,
    tab: 'Saúde / CRM',
    area: 'Certificação · Residência Médica',
    question:
      'Paciente de 58 anos, hipertenso, apresenta dor torácica em repouso há 45 minutos com irradiação para o membro superior esquerdo. ECG mostra supradesnivelamento de ST em D1, aVL, V4-V6. Qual é a conduta imediata prioritária?',
    options: [
      { label: 'A', text: 'Angioplastia primária dentro de 90 min', correct: true },
      { label: 'B', text: 'Trombolítico endovenoso e observação', correct: false },
      { label: 'C', text: 'Holter 24h e nitrato sublingual', correct: false },
      { label: 'D', text: 'Ecocardiograma de estresse imediato', correct: false },
    ],
    meta: { level: 'Difícil', topic: 'Emergências Cardiovasculares' },
  },
  {
    id: 'concurso',
    icon: faLandmark,
    tab: 'Concurso Público',
    area: 'Banca CESPE · Analista Judiciário',
    question:
      'No âmbito da Lei de Responsabilidade Fiscal (LC nº 101/2000), o gestor público que não cumprir os limites de gastos com pessoal previstos na referida lei ficará sujeito à suspensão de transferências voluntárias da União até a regularização, salvo quando destinadas a ações de saúde, educação e assistência social.',
    options: [
      { label: 'C', text: 'Certo', correct: true },
      { label: 'E', text: 'Errado', correct: false },
    ],
    meta: { level: 'Médio', topic: 'Lei de Responsabilidade Fiscal' },
  },
] as const;

type DomainId = (typeof DOMAINS)[number]['id'];

export function TerminalDemo() {
  const [activeId, setActiveId] = useState<DomainId>('aws');
  const [displayedText, setDisplayedText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [generating, setGenerating] = useState(true);

  const domain = DOMAINS.find((d) => d.id === activeId)!;

  useEffect(() => {
    setDisplayedText('');
    setShowOptions(false);
    setGenerating(true);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setGenerating(false);
      setDisplayedText(domain.question);
      setShowOptions(true);
      return;
    }

    let i = 0;
    let interval: ReturnType<typeof setInterval>;

    const generatingDelay = setTimeout(() => {
      setGenerating(false);
      const startDelay = setTimeout(() => {
        interval = setInterval(() => {
          if (i < domain.question.length) {
            setDisplayedText(domain.question.slice(0, i + 1));
            i++;
          } else {
            clearInterval(interval);
            setTimeout(() => setShowOptions(true), 300);
          }
        }, 14);
      }, 200);
      return () => clearTimeout(startDelay);
    }, 900);

    return () => {
      clearTimeout(generatingDelay);
      clearInterval(interval);
    };
  }, [activeId, domain.question]);

  return (
    <div className="relative" id="demo-terminal">
      {/* Card shell */}
      <div className="border border-navy-700/80 rounded-xl overflow-hidden bg-navy-950/90">
        {/* Domain tab bar */}
        <div className="flex items-center gap-1 px-3 pt-3 pb-0">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveId(d.id)}
              aria-pressed={activeId === d.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent hover:cursor-pointer ${
                activeId === d.id
                  ? 'bg-navy-900 text-white border border-navy-700/60 border-b-navy-900 -mb-px'
                  : 'text-navy-500 hover:text-navy-300'
              }`}
            >
              <FontAwesomeIcon icon={d.icon} className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{d.tab}</span>
            </button>
          ))}
        </div>

        {/* Card body */}
        <div className="bg-navy-900 border-t border-navy-700/60 p-5 min-h-80">
          {/* Area label + generating indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-navy-500 font-medium">{domain.area}</span>
            <span
              className={`flex items-center gap-1.5 text-xs transition-opacity duration-300 ${generating ? 'opacity-100' : 'opacity-0'}`}
              aria-live="polite"
              aria-label="Gerando questão"
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} className="text-accent w-3 h-3 generating-pulse" />
              <span className="text-accent font-medium">Gerando questão...</span>
            </span>
          </div>

          {/* Question */}
          <div className={`mb-5 transition-opacity duration-200 ${generating ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-sm text-navy-100 leading-relaxed">
              {displayedText}
              {displayedText.length > 0 && displayedText.length < domain.question.length && (
                <span className="text-accent animate-pulse">▌</span>
              )}
            </p>
          </div>

          {/* Options */}
          {showOptions && (
            <div className="space-y-2">
              {domain.options.map((opt) => (
                <div
                  key={opt.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors duration-150 ${opt.correct ? 'border-accent/40 bg-accent/5' : 'border-navy-800 hover:border-navy-600'}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${opt.correct ? 'border-accent bg-accent/10 text-accent' : 'border-navy-700 text-navy-500'}`}
                  >
                    {opt.correct ? <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" /> : opt.label}
                  </span>
                  <span className={`text-sm ${opt.correct ? 'text-white font-medium' : 'text-navy-400'}`}>
                    {opt.text}
                  </span>
                </div>
              ))}

              {/* Footer meta */}
              <div className="flex items-center gap-3 pt-3 mt-1 border-t border-navy-800/60">
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    domain.meta.level === 'Difícil'
                      ? 'text-orange-400 bg-orange-400/10'
                      : 'text-yellow-400 bg-yellow-400/10'
                  }`}
                >
                  {domain.meta.level}
                </span>
                <span className="text-xs text-navy-600">·</span>
                <span className="text-xs text-navy-400">{domain.meta.topic}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ambient glow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full pointer-events-none bg-accent/[0.08] blur-lg" />
    </div>
  );
}
