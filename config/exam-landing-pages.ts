import type { ExamLandingConfig } from '@/shared/types';

// Verify official values against each certification's current edital before launch.
export const EXAM_LANDING_PAGES: ExamLandingConfig[] = [
  {
    slug: 'cea',
    name: 'CEA',
    fullName: 'Certificação de Especialista em Investimentos',
    provider: 'ANBIMA',
    examType: 'certification',
    totalQuestions: 70,
    examDurationMinutes: 180,
    passingScore: 70,
    topics: [
      'Renda Fixa',
      'Renda Variável',
      'Fundos de Investimento',
      'Derivativos',
      'Previdência Privada',
      'Planejamento Financeiro',
      'Ética e Regulação',
    ],
    heroHeadline: 'Passe na CEA na primeira tentativa com questões no estilo ANBIMA',
    heroSubheadline:
      'Simule o exame real com questões calibradas no estilo ANBIMA. Identifique seus pontos fracos antes do dia da prova.',
    seoTitle: 'Simulado CEA Grátis - Questões com IA | CertifiqueAI',
    seoDescription:
      'Gere questões de prática CEA com IA calibrada para o exame ANBIMA. Simulado gratuito, análise de pontos fracos e estudo direcionado por tópico.',
    faqs: [
      {
        question: 'Quantas questões tem o exame CEA?',
        answer: 'O exame CEA tem 70 questões de múltipla escolha com duração de 3 horas.',
      },
      {
        question: 'Qual a nota mínima para passar no CEA?',
        answer: 'É necessário obter pelo menos 70% de aproveitamento - acertar 49 das 70 questões.',
      },
      {
        question: 'As questões geradas são parecidas com o exame real?',
        answer:
          'Sim. O modelo é calibrado para gerar questões no estilo e nível de dificuldade da banca ANBIMA, cobrindo todos os módulos do edital.',
      },
      {
        question: 'Posso usar o CertifiqueAI sem pagar?',
        answer:
          'Sim. O plano gratuito inclui 250 questões geradas por mês - mais do que suficiente para começar a preparação.',
      },
    ],
  },
  {
    slug: 'cpa-20',
    name: 'CPA-20',
    fullName: 'Certificação Profissional ANBIMA - Série 20',
    provider: 'ANBIMA',
    examType: 'certification',
    totalQuestions: 60,
    examDurationMinutes: 150,
    passingScore: 70,
    topics: [
      'Sistema Financeiro Nacional',
      'Fundos de Investimento',
      'Renda Fixa',
      'Renda Variável',
      'Derivativos',
      'Gestão de Carteiras',
      'Planejamento Financeiro',
      'Ética',
    ],
    heroHeadline: 'Aprove no CPA-20 com questões calibradas para a banca ANBIMA',
    heroSubheadline:
      'Prepare-se para o exame ANBIMA com questões calibradas para o nível CPA-20. Descubra seus pontos fracos antes da prova.',
    seoTitle: 'Simulado CPA-20 Grátis - Questões com IA | CertifiqueAI',
    seoDescription:
      'Gere questões de prática CPA-20 com IA calibrada para o exame ANBIMA Série 20. Simulado gratuito e análise por tópico.',
    faqs: [
      {
        question: 'Quantas questões tem o exame CPA-20?',
        answer: 'O exame CPA-20 tem 60 questões de múltipla escolha com duração de 2 horas e 30 minutos.',
      },
      {
        question: 'Qual a diferença entre CPA-10 e CPA-20?',
        answer:
          'O CPA-20 habilita o profissional a atender clientes de alta renda e é exigido por instituições como private banks. O CPA-10 é voltado para varejo.',
      },
      {
        question: 'As questões cobrem todo o conteúdo do edital?',
        answer: 'Sim. O conteúdo é distribuído proporcionalmente entre os módulos do edital ANBIMA vigente.',
      },
    ],
  },
  {
    slug: 'aws-solutions-architect',
    name: 'AWS SAA-C03',
    fullName: 'AWS Certified Solutions Architect - Associate',
    provider: 'Amazon Web Services',
    examType: 'certification',
    totalQuestions: 65,
    examDurationMinutes: 130,
    passingScore: 72,
    topics: [
      'Resiliência',
      'Alta Disponibilidade',
      'Segurança',
      'Performance',
      'Otimização de Custos',
      'Serviços de Computação',
      'Armazenamento',
      'Bancos de Dados',
      'Redes',
      'Integração de Aplicações',
    ],
    heroHeadline: 'Conquiste sua certificação AWS SAA-C03 com cenários no estilo da prova real',
    heroSubheadline:
      'Treine para o exame SAA-C03 com questões de cenário calibradas no estilo AWS. Identifique lacunas antes da prova.',
    seoTitle: 'Simulado AWS SAA-C03 Grátis - Questões com IA | CertifiqueAI',
    seoDescription:
      'Gere questões de prática para o exame AWS Certified Solutions Architect Associate (SAA-C03) com IA. Cenários realistas, análise de pontos fracos.',
    faqs: [
      {
        question: 'Quantas questões tem o exame AWS SAA-C03?',
        answer: 'O exame tem 65 questões (múltipla escolha e múltipla resposta) com duração de 130 minutos.',
      },
      {
        question: 'Qual é a nota de corte do AWS SAA-C03?',
        answer: 'A nota mínima é 720 em uma escala de 100-1000, o que equivale aproximadamente a 72% de acerto.',
      },
      {
        question: 'As questões são em português?',
        answer:
          'Sim. Todas as questões geradas pelo CertifiqueAI são em português, incluindo terminologia técnica AWS.',
      },
    ],
  },
  {
    slug: 'aws-cloud-practitioner',
    name: 'AWS CLF-C02',
    fullName: 'AWS Certified Cloud Practitioner',
    provider: 'Amazon Web Services',
    examType: 'certification',
    totalQuestions: 65,
    examDurationMinutes: 90,
    passingScore: 70,
    topics: [
      'Conceitos de Nuvem',
      'Segurança e Conformidade',
      'Tecnologia AWS',
      'Faturamento e Preços',
      'Infraestrutura Global',
      'Modelos de Serviço (IaaS/PaaS/SaaS)',
    ],
    heroHeadline: 'Passe no AWS CLF-C02 na primeira tentativa em 4 semanas',
    heroSubheadline:
      'Prepare sua primeira certificação AWS com questões calibradas para o CLF-C02. Comece agora, sem custo.',
    seoTitle: 'Simulado AWS Cloud Practitioner Grátis - Questões com IA | CertifiqueAI',
    seoDescription:
      'Gere questões para o AWS Certified Cloud Practitioner (CLF-C02) com IA. Simulado gratuito, explicações detalhadas, análise por domínio.',
    faqs: [
      {
        question: 'O AWS Cloud Practitioner é fácil?',
        answer:
          'É o exame de entrada da AWS. Com estudo direcionado e prática constante, a maioria dos candidatos passa em 4-6 semanas.',
      },
      {
        question: 'Quantas questões tem o exame CLF-C02?',
        answer: 'O exame tem 65 questões com duração de 90 minutos.',
      },
    ],
  },
  {
    slug: 'azure-fundamentals',
    name: 'AZ-900',
    fullName: 'Microsoft Azure Fundamentals',
    provider: 'Microsoft',
    examType: 'certification',
    totalQuestions: 60,
    examDurationMinutes: 85,
    passingScore: 70,
    topics: [
      'Conceitos de Nuvem',
      'Serviços Azure',
      'Segurança e Governança',
      'Preços e Suporte',
      'Identidade e Acesso',
      'Conformidade',
    ],
    heroHeadline: 'Certifique-se no AZ-900 com questões no estilo Microsoft',
    heroSubheadline:
      'Treine para o Azure Fundamentals com questões calibradas no estilo Microsoft. Descubra seus pontos fracos em minutos.',
    seoTitle: 'Simulado AZ-900 Grátis - Questões Azure com IA | CertifiqueAI',
    seoDescription:
      'Gere questões de prática para o Microsoft Azure Fundamentals (AZ-900) com IA. Simulado gratuito, análise por domínio, explicações em português.',
    faqs: [
      {
        question: 'Qual é a nota de corte do AZ-900?',
        answer: 'A nota mínima é 700 em uma escala de 0-1000, o que corresponde a aproximadamente 70% de acerto.',
      },
      {
        question: 'O AZ-900 é bom ponto de partida para Azure?',
        answer:
          'Sim. É a certificação de entrada da trilha Microsoft Azure e cobre os fundamentos necessários para avançar para exames como AZ-104 e AZ-204.',
      },
    ],
  },
  {
    slug: 'oab',
    name: 'OAB',
    fullName: 'Exame da Ordem dos Advogados do Brasil - Primeira Fase',
    provider: 'FGV',
    examType: 'certification',
    totalQuestions: 80,
    examDurationMinutes: 300,
    passingScore: 50,
    topics: [
      'Direito Constitucional',
      'Direito Administrativo',
      'Direito Civil',
      'Direito Penal',
      'Direito Processual Civil',
      'Direito Processual Penal',
      'Direito do Trabalho',
      'Direito Tributário',
      'Ética e Estatuto da OAB',
    ],
    heroHeadline: 'Passe na OAB com questões no estilo FGV para todos os temas',
    heroSubheadline:
      'Treine com questões no estilo FGV para a OAB. Identifique suas matérias mais fracas e estude de forma direcionada.',
    seoTitle: 'Simulado OAB Primeira Fase Grátis - Questões com IA | CertifiqueAI',
    seoDescription:
      'Gere questões de prática para a OAB Primeira Fase com IA calibrada no estilo FGV. Simulado gratuito, análise por matéria, explicações detalhadas.',
    faqs: [
      {
        question: 'Quantas questões tem a OAB Primeira Fase?',
        answer: 'A primeira fase tem 80 questões de múltipla escolha com duração de 5 horas.',
      },
      {
        question: 'Qual é a nota de corte da OAB Primeira Fase?',
        answer: 'É necessário acertar pelo menos 50% das questões (40 de 80) para ser aprovado na primeira fase.',
      },
      {
        question: 'As questões cobrem o conteúdo da FGV?',
        answer:
          'Sim. As questões são geradas com base no edital vigente e calibradas para o estilo de prova da banca FGV.',
      },
    ],
  },
];

export const EXAM_LANDING_PAGE_MAP = new Map(EXAM_LANDING_PAGES.map((exam) => [exam.slug, exam]));
