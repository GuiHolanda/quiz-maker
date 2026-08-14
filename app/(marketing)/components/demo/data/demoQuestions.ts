import type { DemoCert } from './demoCatalog';
import type { DemoQuestion } from '@/shared/types';

const STEMS = [
  'Qual é a abordagem recomendada para',
  'Em um cenário de alta disponibilidade para',
  'Qual serviço ou recurso deve ser utilizado para',
  'Uma equipe de operações precisa implementar',
  'Como deve ser configurado o ambiente para',
] as const;

const OPTIONS_SETS: ReadonlyArray<readonly [string, string, string, string]> = [
  [
    'Utilizar o serviço gerenciado apropriado da plataforma',
    'Implementar uma solução customizada com scripts manuais',
    'Delegar para um serviço de terceiros externo',
    'Usar a configuração padrão sem ajustes',
  ],
  [
    'Configurar redundância em múltiplas zonas de disponibilidade',
    'Centralizar todos os recursos em uma única zona',
    'Aplicar a configuração padrão de cota do serviço',
    'Ignorar requisitos de disponibilidade na fase inicial',
  ],
  [
    'Aplicar o princípio de menor privilégio no controle de acesso',
    'Conceder acesso administrativo completo para simplificar',
    'Remover todas as políticas de segurança existentes',
    'Criar usuários compartilhados entre os sistemas',
  ],
  [
    'Implementar monitoramento e alertas proativos',
    'Desabilitar logs para reduzir custo de armazenamento',
    'Concentrar todas as métricas em um único painel básico',
    'Aguardar detecção manual de falhas em produção',
  ],
  [
    'Automatizar o processo com pipeline de integração contínua',
    'Executar deploys manuais via acesso direto aos servidores',
    'Manter o código apenas em ambiente local sem versionamento',
    'Fazer deploy direto na produção sem ambiente de testes',
  ],
];

const EXPLANATIONS = [
  'Esta é a abordagem recomendada pela documentação oficial. As demais alternativas introduzem complexidade desnecessária ou riscos operacionais que devem ser evitados.',
  'A opção correta segue as melhores práticas para este domínio. As alternativas incorretas violam princípios fundamentais de segurança ou eficiência operacional.',
  'Este recurso foi projetado especificamente para este caso de uso. As demais opções, embora possíveis, não são as recomendadas pela certificação neste contexto.',
  'De acordo com o conteúdo programático oficial, esta é a resposta correta. As demais representam anti-padrões comuns que a certificação espera que o candidato identifique e evite.',
] as const;

export function generateDemoQuestions(cert: DemoCert, alloc: Record<string, number>): DemoQuestion[] {
  const questions: DemoQuestion[] = [];
  const activeTopics = cert.domains.filter((domain) => (alloc[domain.name] ?? 0) > 0);

  activeTopics.forEach((domain) => {
    const count = alloc[domain.name] ?? 0;

    for (let i = 0; i < count; i++) {
      const globalIndex = questions.length;
      const stemIndex = globalIndex % STEMS.length;
      const optionsIndex = globalIndex % OPTIONS_SETS.length;
      const explanationIndex = globalIndex % EXPLANATIONS.length;
      const insertAt = globalIndex % 4;

      const stem = `${STEMS[stemIndex]} ${domain.name.toLowerCase()} em ambientes ${cert.track.toLowerCase()}?`;

      // Rotate the correct option (always first in the set) to different positions
      const [correct, ...wrong] = OPTIONS_SETS[optionsIndex];
      const opts = [...wrong];
      opts.splice(insertAt, 0, correct);

      questions.push({
        text: stem,
        options: opts as unknown as readonly [string, string, string, string],
        correctIndex: insertAt,
        topic: domain.name,
        explanation: EXPLANATIONS[explanationIndex],
      });
    }
  });

  return questions;
}
