// Gabarito dos editais de referência usados pelo edital-benchmark. Cada campo aqui foi
// conferido manualmente contra o PDF em edital-fixtures/*.pdf — é a única parte do benchmark
// que pode estar errada sem que nada acuse, então qualquer alteração deve reabrir o PDF.
//
// Percentuais de seção seguem a convenção do projeto (CLAUDE.md § Database): inteiros 0–100,
// nunca a contagem bruta de questões. Onde a divisão exata gera dízima, o percentual já vem
// arredondado — a tolerância de comparação (ver edital-scoring.ts) absorve o resto.

export interface ExpectedSection {
  readonly name: string;
  readonly percentage: number; // 0-100, ver nota acima
  // Amostra representativa de tópicos — não exaustiva salvo indicação em comentário — usada
  // pelo judge de cobertura semântica. Paráfrase é esperada e não deve penalizar.
  readonly topicsSample: readonly string[];
}

export interface ExpectedEdital {
  readonly id: string;
  readonly label: string;
  readonly pdfFile: string; // nome do arquivo em edital-fixtures/
  // O texto exatamente como um usuário digitaria na busca — usado pela Etapa A (identify).
  readonly identifyQuery: string;
  readonly examName: string;
  readonly examBoard: string;
  readonly role: string; // cargo usado para restringir a extração — obrigatório no locate real
  readonly year: number;
  readonly key: string; // número do edital como aparece no documento
  readonly totalQuestions: number;
  readonly examDurationMinutes: number;
  readonly passingScore: number; // 0-100
  readonly sections: readonly ExpectedSection[];
  // Sufixos de domínio aceitos como "oficial" para esta banca/órgão — usados para checar
  // domainClass/isOfficialDomain do candidato que a Etapa A (locate) devolve.
  readonly officialDomainSuffixes: readonly string[];
}

export const EXPECTED_EDITAIS: readonly ExpectedEdital[] = [
  {
    id: 'transpetro',
    label: 'Transpetro PSP/TERRA/Nível Superior 2026.4 — Engenharia Mecânica (Cesgranrio)',
    pdfFile: 'transpetro-2026-4.pdf',
    identifyQuery: 'Transpetro 2026',
    examName: 'Processo Seletivo Público Transpetro PSP/TERRA/Nível Superior 2026.4',
    examBoard: 'Cesgranrio',
    role: 'Engenharia Mecânica',
    year: 2026,
    key: '04/2026',
    totalQuestions: 70,
    examDurationMinutes: 270,
    passingScore: 50,
    sections: [
      {
        name: 'Língua Portuguesa',
        percentage: 14,
        // Lista completa dos 12 itens do bloco "CONHECIMENTOS BÁSICOS" (comum a todas as
        // ênfases) — Anexo IV do edital.
        topicsSample: [
          'Compreensão de textos',
          'Ortografia oficial',
          'Mecanismos de coesão textual',
          'Significação das palavras',
          'Emprego de tempos e modos verbais',
          'Emprego das classes de palavras',
          'Coordenação e de subordinação',
          'Emprego dos sinais de pontuação',
          'Concordância verbal e nominal',
          'Regência verbal e nominal',
          'Emprego do sinal indicativo de crase',
          'Colocação dos pronomes átonos',
        ],
      },
      {
        name: 'Língua Inglesa',
        percentage: 14,
        // Lista completa — 2 itens.
        topicsSample: ['Compreensão de texto escrito em língua inglesa', 'Itens gramaticais relevantes para a compreensão dos conteúdos semânticos'],
      },
      {
        name: 'Conhecimentos Específicos de Engenharia Mecânica',
        percentage: 72,
        // Amostra dos 18 blocos numerados da ÊNFASE 25 — não exaustiva (a lista completa
        // inclui detalhamento extenso de cada bloco no edital).
        topicsSample: [
          'Termodinâmica',
          'Mecânica dos Fluidos',
          'Transmissão do Calor',
          'Resistência dos Materiais',
          'Elementos de Máquinas',
          'Fundamentos da Dinâmica',
          'Vibrações Mecânicas',
          'Máquinas de Fluxo',
          'Motores de Combustão Interna',
          'Ciclos de Geração de Potência',
          'Corrosão',
          'Seleção de Materiais',
          'Metalurgia',
          'Processos de Fabricação Mecânica',
          'Soldagem',
          'Noções de Estatística e Probabilidade com aplicações em Engenharia',
          'Eletrotécnica',
          'Segurança do Trabalho e Meio Ambiente',
        ],
      },
    ],
    officialDomainSuffixes: ['transpetro.com.br', 'cesgranrio.org.br'],
  },
  {
    id: 'campina-grande',
    label: 'Concurso Prefeitura de Campina Grande 01/2026 — Agente Administrativo (IDECAN)',
    pdfFile: 'campina-grande-01-2026.pdf',
    identifyQuery: 'Concurso Prefeitura Campina Grande 2026',
    examName: 'Concurso Público Prefeitura Municipal de Campina Grande 2026',
    examBoard: 'IDECAN',
    role: 'Agente Administrativo',
    year: 2026,
    key: '01/2026',
    totalQuestions: 40,
    examDurationMinutes: 180,
    passingScore: 50,
    sections: [
      {
        name: 'Língua Portuguesa',
        percentage: 25,
        topicsSample: [
          'Leitura, compreensão e interpretação de textos',
          'Sintaxe: processos de coordenação e subordinação',
          'Emprego de tempos e modos verbais',
          'Concordância nominal e verbal',
          'Ortografia oficial',
          'Acentuação gráfica',
        ],
      },
      {
        name: 'Raciocínio Lógico',
        percentage: 10,
        topicsSample: [
          'Estrutura lógica de relações arbitrárias entre pessoas, lugares, objetos ou eventos fictícios',
          'Compreensão e análise lógica de situações-problema',
          'Operações lógicas e resolução de problemas',
        ],
      },
      {
        name: 'História de Campina Grande/PB',
        percentage: 8,
        topicsSample: ['História geral sobre o município de Campina Grande, na Paraíba'],
      },
      {
        name: 'Legislação e Ética no Serviço Público',
        percentage: 7,
        topicsSample: [
          'Lei Orgânica do Município de Campina Grande',
          'Lei Geral de Proteção de Dados Pessoais (LGPD)',
          'Lei de Acesso à Informação (LAI)',
          'Ética no serviço público',
          'Princípios da Administração Pública aplicados à ética',
        ],
      },
      {
        name: 'Conhecimentos Específicos de Agente Administrativo',
        percentage: 50,
        topicsSample: [
          'Redação de correspondências e documentos em geral',
          'Documentação administrativa e redação oficial',
          'Atos administrativos: conceito, requisitos, atributos, classificação e espécies',
          'Protocolo, arquivo e gestão documental',
          'Licitações e contratos administrativos, com ênfase na Lei nº 14.133/2021',
          'Orçamento público, PPA, LDO, LOA, Lei nº 4.320/1964 e Lei de Responsabilidade Fiscal',
        ],
      },
    ],
    officialDomainSuffixes: ['campinagrande.pb.gov.br', 'idecan.org.br'],
  },
];
