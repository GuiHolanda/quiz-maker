import type { ExamLandingConfig } from '@/shared/types';

// Verify official values — question counts, duration, passing score and topic
// weights — against each certification's current edital before launch. Topic
// weights are integers 0–100 and describe the share of the exam each subject
// accounts for; they drive the syllabus bars and the simulado breakdown.
export const EXAM_LANDING_PAGES: ExamLandingConfig[] = [
  {
    slug: 'cea',
    demoExamName: 'CEA — Certificação de Especialista em Investimentos ANBIMA',
    name: 'CEA',
    fullName: 'Certificação de Especialista em Investimentos',
    provider: 'ANBIMA',
    examType: 'certification',
    totalQuestions: 70,
    examDurationMinutes: 180,
    passingScore: 70,
    topics: [
      { name: 'Renda Fixa', weight: 18 },
      { name: 'Fundos de Investimento', weight: 18 },
      { name: 'Previdência Privada', weight: 15 },
      { name: 'Planejamento Financeiro', weight: 15 },
      { name: 'Renda Variável', weight: 14 },
      { name: 'Derivativos', weight: 10 },
      { name: 'Ética e Regulação', weight: 10 },
    ],
    sampleQuestions: [
      {
        topic: 'Planejamento Financeiro',
        stem: 'Um investidor mantém uma carteira com dois ativos de correlação negativa. Ao aumentar a participação do ativo de menor volatilidade, o que tende a ocorrer com o risco total da carteira?',
        options: [
          'Aumenta proporcionalmente à participação do ativo',
          'Reduz, pelo efeito da diversificação',
          'Permanece inalterado, por depender apenas dos ativos individuais',
          'Passa a depender apenas do risco sistemático',
        ],
        answerIndex: 1,
        explanation:
          'Com correlação negativa os movimentos dos ativos se compensam em parte, e o desvio-padrão da carteira fica abaixo da média ponderada dos desvios individuais. O risco diversificável cai; o risco sistemático permanece, o que torna a última alternativa atraente mas incorreta.',
      },
      {
        topic: 'Previdência Privada',
        stem: 'Em um plano PGBL, qual é o tratamento tributário aplicável no momento do resgate?',
        options: [
          'O imposto incide apenas sobre o rendimento acumulado',
          'O imposto incide sobre o valor total resgatado',
          'Há isenção após dez anos de acumulação',
          'O imposto incide sobre o total, deduzidas as contribuições feitas',
        ],
        answerIndex: 1,
        explanation:
          'No PGBL a tributação no resgate incide sobre o valor total, justamente porque as contribuições foram dedutíveis da base do IR até 12% da renda bruta anual. A primeira alternativa descreve o VGBL, o que a torna a distratora mais comum.',
      },
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
    demoExamName: 'CPA-20 — Certificação Profissional ANBIMA Série 20',
    name: 'CPA-20',
    fullName: 'Certificação Profissional ANBIMA - Série 20',
    provider: 'ANBIMA',
    examType: 'certification',
    totalQuestions: 60,
    examDurationMinutes: 150,
    passingScore: 70,
    topics: [
      { name: 'Fundos de Investimento', weight: 20 },
      { name: 'Ética', weight: 15 },
      { name: 'Renda Fixa', weight: 15 },
      { name: 'Renda Variável', weight: 12 },
      { name: 'Sistema Financeiro Nacional', weight: 10 },
      { name: 'Gestão de Carteiras', weight: 10 },
      { name: 'Planejamento Financeiro', weight: 10 },
      { name: 'Derivativos', weight: 8 },
    ],
    sampleQuestions: [
      {
        topic: 'Ética',
        stem: 'Ao recomendar um produto de investimento a um cliente de perfil conservador, o profissional identifica que o produto é inadequado ao perfil. Qual conduta atende ao dever de verificação de adequação?',
        options: [
          'Recomendar o produto e registrar a decisão do cliente',
          'Não recomendar o produto e alertar o cliente sobre a inadequação',
          'Recomendar o produto apenas se o cliente assinar termo de ciência',
          'Encaminhar a decisão à área comercial da instituição',
        ],
        answerIndex: 1,
        explanation:
          'O dever de suitability exige que o profissional não recomende produto incompatível com o perfil e informe a inadequação. Termos de ciência registram operações por iniciativa do cliente, mas não substituem o dever de adequação — por isso a terceira alternativa parece plausível e não é.',
      },
      {
        topic: 'Fundos de Investimento',
        stem: 'Qual é a característica do fundo aberto quanto ao resgate de cotas?',
        options: [
          'O resgate só ocorre no encerramento do prazo do fundo',
          'As cotas podem ser resgatadas conforme as regras de prazo do regulamento',
          'As cotas são negociadas em bolsa entre os cotistas',
          'O resgate depende de aprovação em assembleia de cotistas',
        ],
        answerIndex: 1,
        explanation:
          'No fundo aberto o cotista solicita resgate segundo os prazos do regulamento e o patrimônio é variável. As demais alternativas descrevem o fundo fechado, em que a saída se dá no encerramento ou pela negociação das cotas no mercado secundário.',
      },
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
    demoExamName: 'AWS Certified Solutions Architect – Associate',
    name: 'AWS SAA-C03',
    fullName: 'AWS Certified Solutions Architect - Associate',
    provider: 'Amazon Web Services',
    examType: 'certification',
    totalQuestions: 65,
    examDurationMinutes: 130,
    passingScore: 72,
    topics: [
      { name: 'Segurança', weight: 16 },
      { name: 'Resiliência', weight: 13 },
      { name: 'Alta Disponibilidade', weight: 13 },
      { name: 'Performance', weight: 12 },
      { name: 'Otimização de Custos', weight: 10 },
      { name: 'Serviços de Computação', weight: 10 },
      { name: 'Armazenamento', weight: 8 },
      { name: 'Bancos de Dados', weight: 7 },
      { name: 'Redes', weight: 7 },
      { name: 'Integração de Aplicações', weight: 4 },
    ],
    sampleQuestions: [
      {
        topic: 'Armazenamento',
        stem: 'Uma aplicação precisa de armazenamento de arquivos compartilhado entre várias instâncias EC2 em Zonas de Disponibilidade diferentes. Qual serviço atende ao requisito?',
        options: ['Amazon EBS', 'Amazon EFS', 'EC2 Instance Store', 'Amazon S3 Glacier'],
        answerIndex: 1,
        explanation:
          'O EFS é um sistema de arquivos compartilhado via NFS, acessível simultaneamente de múltiplas AZs. O EBS anexa a uma instância por vez, o Instance Store é efêmero e local, e o Glacier é arquivamento de objetos — nenhum deles entrega acesso de arquivos concorrente entre AZs.',
      },
      {
        topic: 'Otimização de Custos',
        stem: 'Uma empresa quer reduzir o custo de instâncias EC2 que rodam de forma contínua e previsível pelos próximos três anos. Qual modelo de compra atende melhor?',
        options: [
          'On-Demand',
          'Spot Instances',
          'Savings Plans ou Instâncias Reservadas',
          'Dedicated Hosts cobrados por hora',
        ],
        answerIndex: 2,
        explanation:
          'Cargas contínuas e previsíveis se beneficiam de compromisso de longo prazo, que é exatamente o que Savings Plans e Instâncias Reservadas oferecem. Spot atende cargas interrompíveis e Dedicated Hosts resolvem requisitos de licenciamento e isolamento, não de economia em carga estável.',
      },
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
      { name: 'Tecnologia AWS', weight: 28 },
      { name: 'Segurança e Conformidade', weight: 26 },
      { name: 'Conceitos de Nuvem', weight: 20 },
      { name: 'Faturamento e Preços', weight: 12 },
      { name: 'Infraestrutura Global', weight: 8 },
      { name: 'Modelos de Serviço (IaaS/PaaS/SaaS)', weight: 6 },
    ],
    sampleQuestions: [
      {
        topic: 'Segurança e Conformidade',
        stem: 'Segundo o modelo de responsabilidade compartilhada da AWS, qual item é responsabilidade do cliente ao usar o Amazon EC2?',
        options: [
          'A segurança física dos data centers',
          'A aplicação de patches no sistema operacional convidado',
          'A manutenção do hardware do host',
          'A separação de rede entre Regiões',
        ],
        answerIndex: 1,
        explanation:
          'No EC2 a AWS cuida da segurança da nuvem — instalações, hardware e virtualização — e o cliente cuida da segurança na nuvem, o que inclui patches do SO convidado, configuração de security groups e dados. As demais alternativas descrevem itens que nunca saem do lado da AWS.',
      },
      {
        topic: 'Faturamento e Preços',
        stem: 'Uma equipe quer ser avisada quando o gasto mensal da conta ultrapassar um limite definido. Qual recurso atende ao requisito?',
        options: [
          'AWS Trusted Advisor',
          'AWS Budgets, com alertas de orçamento',
          'Amazon CloudWatch Logs',
          'AWS Pricing Calculator',
        ],
        answerIndex: 1,
        explanation:
          'O AWS Budgets define limites de custo ou uso e dispara alertas quando eles são atingidos. O Trusted Advisor sugere otimizações, o CloudWatch Logs trata de dados operacionais e a Pricing Calculator estima custos antes da contratação — nenhum deles notifica estouro de gasto.',
      },
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
    demoExamName: 'Microsoft Azure Fundamentals',
    name: 'AZ-900',
    fullName: 'Microsoft Azure Fundamentals',
    provider: 'Microsoft',
    examType: 'certification',
    totalQuestions: 60,
    examDurationMinutes: 85,
    passingScore: 70,
    topics: [
      { name: 'Serviços Azure', weight: 30 },
      { name: 'Conceitos de Nuvem', weight: 26 },
      { name: 'Segurança e Governança', weight: 14 },
      { name: 'Preços e Suporte', weight: 14 },
      { name: 'Identidade e Acesso', weight: 10 },
      { name: 'Conformidade', weight: 6 },
    ],
    sampleQuestions: [
      {
        topic: 'Identidade e Acesso',
        stem: 'Qual recurso do Microsoft Entra ID permite exigir um segundo fator de autenticação apenas quando o acesso vem de fora da rede corporativa?',
        options: ['Acesso Condicional', 'Grupos dinâmicos', 'Azure Policy', 'Managed Identity'],
        answerIndex: 0,
        explanation:
          'O Acesso Condicional avalia sinais como localização, dispositivo e risco da sessão para decidir se exige MFA ou bloqueia o acesso. O Azure Policy trata de conformidade de recursos e a Managed Identity, de credenciais de aplicações — ambos soam próximos, mas não avaliam o contexto do login.',
      },
      {
        topic: 'Preços e Suporte',
        stem: 'Uma equipe quer receber alertas quando o gasto mensal da assinatura passar de um limite definido. Qual recurso usar?',
        options: [
          'Azure Advisor',
          'Azure Cost Management, com orçamentos',
          'Azure Monitor Metrics',
          'Azure Pricing Calculator',
        ],
        answerIndex: 1,
        explanation:
          'Orçamentos no Cost Management definem limites de gasto e disparam alertas ao serem atingidos. O Advisor recomenda otimizações, o Monitor acompanha métricas operacionais e a Pricing Calculator estima custos antes da contratação.',
      },
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
      { name: 'Ética e Estatuto da OAB', weight: 13 },
      { name: 'Direito Constitucional', weight: 12 },
      { name: 'Direito Civil', weight: 12 },
      { name: 'Direito Processual Civil', weight: 12 },
      { name: 'Direito Penal', weight: 11 },
      { name: 'Direito Processual Penal', weight: 10 },
      { name: 'Direito do Trabalho', weight: 10 },
      { name: 'Direito Administrativo', weight: 10 },
      { name: 'Direito Tributário', weight: 10 },
    ],
    sampleQuestions: [
      {
        topic: 'Ética e Estatuto da OAB',
        stem: 'Sobre a publicidade profissional da advocacia, é correto afirmar que o advogado:',
        options: [
          'Pode anunciar os valores dos seus honorários para atrair clientela',
          'Deve manter caráter informativo e discreto, sendo vedada a captação de clientela',
          'Está impedido de manter perfis profissionais em redes sociais',
          'Pode oferecer serviços gratuitos em anúncio para divulgar o escritório',
        ],
        answerIndex: 1,
        explanation:
          'A publicidade da advocacia é permitida com finalidade informativa e moderação, vedadas a mercantilização e a captação de clientela — inclusive o anúncio de valores, gratuidade ou forma de pagamento. A presença em redes sociais não é proibida; o que se regula é o conteúdo e o tom do anúncio.',
      },
      {
        topic: 'Direito Processual Civil',
        stem: 'No procedimento comum do CPC, qual é o prazo para o réu apresentar contestação, contado na forma do art. 335?',
        options: ['5 dias úteis', '10 dias úteis', '15 dias úteis', '30 dias corridos'],
        answerIndex: 2,
        explanation:
          'O art. 335 do CPC fixa 15 dias para a contestação, contados conforme os incisos do próprio artigo, e o art. 219 determina a contagem em dias úteis para prazos processuais. Prazos de 5 e 10 dias existem no Código para outros atos, o que torna as distratoras plausíveis para quem decora números soltos.',
      },
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
