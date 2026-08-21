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
    heroHeadline: 'Questões novas de CEA todo dia, com o porquê de cada alternativa',
    heroSubheadline:
      'Escolha um assunto do edital da ANBIMA e receba questões novas no formato da prova, com a explicação de por que cada alternativa está certa ou errada. Sem decorar o gabarito do mesmo simulado de sempre.',
    seoTitle: 'Simulado CEA grátis com gabarito comentado | CertifiqueAI',
    seoDescription:
      'Responda questões de CEA por assunto do edital da ANBIMA, com explicação de cada alternativa. As 10 primeiras são grátis e sem cadastro.',
    faqs: [
      {
        question: 'Quantas questões tem o exame CEA?',
        answer: 'O exame CEA tem 70 questões de múltipla escolha com duração de 3 horas.',
      },
      {
        question: 'Qual a nota mínima para passar no CEA?',
        answer: 'É necessário obter pelo menos 70% de aproveitamento, ou seja, acertar 49 das 70 questões.',
      },
      {
        question: 'As questões acompanham o nível da prova da ANBIMA?',
        answer:
          'Sim. Cada item nasce de um tópico do programa detalhado da certificação e sai no formato e no nível de dificuldade que a prova cobra, cobrindo todos os módulos do edital.',
      },
      {
        question: 'As questões repetem se eu treinar o mesmo assunto várias vezes?',
        answer:
          'Não. Cada rodada produz itens novos a partir do conteúdo programático, mesmo quando você repete o assunto e o nível. É o que permite estudar todo dia sem decorar gabarito.',
      },
      {
        question: 'Como vocês verificam se o gabarito está certo?',
        answer:
          'Antes de entrar em circulação, cada item passa por uma etapa de revisão que confere se existe uma única alternativa correta e se enunciado, gabarito e explicação são coerentes entre si.',
      },
      {
        question: 'Quanto custa depois das questões gratuitas?',
        answer:
          'O plano gratuito dá 100 questões por mês, sem custo e sem cartão. O plano Pro custa R$29,90 por mês e sobe para 1000 questões, com mais exames salvos.',
      },
    ],
  },
  {
    slug: 'cpa-20',
    demoExamName: 'CPA-20 — Certificação Profissional ANBIMA Série 20',
    name: 'CPA-20',
    fullName: 'Certificação Profissional ANBIMA, série 20',
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
          'O dever de suitability exige que o profissional não recomende produto incompatível com o perfil e informe a inadequação. Termos de ciência registram operações por iniciativa do cliente, mas não substituem o dever de adequação. É por isso que a terceira alternativa parece plausível e não é.',
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
    heroHeadline: 'Treine para o CPA-20 sem repetir questão nenhuma vez',
    heroSubheadline:
      'Questões novas a cada rodada, organizadas pelos módulos do programa da ANBIMA e com a justificativa de cada alternativa. O banco não acaba, então não dá para decorar.',
    seoTitle: 'Simulado CPA-20 grátis com gabarito comentado | CertifiqueAI',
    seoDescription:
      'Questões de CPA-20 por módulo do programa da ANBIMA, com explicação alternativa por alternativa. As 10 primeiras são grátis e sem cadastro.',
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
      {
        question: 'As questões repetem se eu treinar o mesmo módulo várias vezes?',
        answer:
          'Não. Cada rodada gera itens novos dentro do módulo escolhido, então dá para voltar ao mesmo assunto quantas vezes precisar sem reencontrar o mesmo enunciado.',
      },
      {
        question: 'Como vocês verificam se o gabarito está certo?',
        answer:
          'Cada item passa por uma revisão automática de consistência antes de circular: alternativa única correta e coerência entre enunciado, gabarito e explicação.',
      },
      {
        question: 'Preciso de cartão de crédito para começar?',
        answer:
          'Não. As primeiras questões não pedem nem cadastro. A conta gratuita também não pede cartão e libera 100 questões por mês.',
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
          'O EFS é um sistema de arquivos compartilhado via NFS, acessível simultaneamente de múltiplas AZs. O EBS anexa a uma instância por vez, o Instance Store é efêmero e local, e o Glacier é arquivamento de objetos. Nenhum deles entrega acesso de arquivos concorrente entre AZs.',
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
    heroHeadline: 'Cenários novos de SAA-C03 a cada rodada, com o motivo de cada distratora',
    heroSubheadline:
      'Cenários no formato da prova, por domínio do exame, com o motivo pelo qual cada distratora parece certa. Nada de repetir a mesma lista até memorizar a resposta.',
    seoTitle: 'Simulado AWS SAA-C03 com gabarito comentado | CertifiqueAI',
    seoDescription:
      'Cenários de AWS SAA-C03 por domínio do exame, com o motivo de cada distratora. As 10 primeiras questões são grátis e sem cadastro.',
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
      {
        question: 'As questões repetem se eu treinar o mesmo domínio várias vezes?',
        answer:
          'Não. Cada rodada monta cenários novos dentro do domínio escolhido, então você pode insistir em rede ou em segurança sem reencontrar o mesmo caso.',
      },
      {
        question: 'Como vocês verificam se o gabarito está certo?',
        answer:
          'Antes de circular, cada item passa por uma revisão de consistência que confere alternativa única correta e coerência entre cenário, gabarito e explicação.',
      },
      {
        question: 'Quanto custa depois das questões gratuitas?',
        answer:
          'O plano gratuito dá 100 questões por mês, sem cartão. O plano Pro custa R$29,90 por mês e sobe para 1000 questões, com mais exames salvos.',
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
          'No EC2 a AWS cuida da segurança da nuvem, ou seja, instalações, hardware e virtualização, e o cliente cuida da segurança na nuvem, o que inclui patches do SO convidado, configuração de security groups e dados. As demais alternativas descrevem itens que nunca saem do lado da AWS.',
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
          'O AWS Budgets define limites de custo ou uso e dispara alertas quando eles são atingidos. O Trusted Advisor sugere otimizações, o CloudWatch Logs trata de dados operacionais e a Pricing Calculator estima custos antes da contratação. Nenhum deles notifica estouro de gasto.',
      },
    ],
    heroHeadline: 'Questões de CLF-C02 por domínio, explicadas alternativa por alternativa',
    heroSubheadline:
      'Sua primeira certificação AWS sem gastar para começar: questões por domínio do CLF-C02, com a explicação de cada alternativa e o diagnóstico do que revisar.',
    seoTitle: 'Simulado AWS Cloud Practitioner grátis | CertifiqueAI',
    seoDescription:
      'Questões de AWS Cloud Practitioner (CLF-C02) por domínio, com explicação de cada alternativa. As 10 primeiras são grátis e sem cadastro.',
    faqs: [
      {
        question: 'O AWS Cloud Practitioner é fácil?',
        answer:
          'É o exame de entrada da AWS e não exige experiência prévia. O conteúdo cobre conceitos de nuvem, serviços principais, segurança e faturamento, inclusive para funções não técnicas.',
      },
      {
        question: 'Quantas questões tem o exame CLF-C02?',
        answer: 'O exame tem 65 questões com duração de 90 minutos.',
      },
      {
        question: 'Preciso de experiência com nuvem para começar a treinar?',
        answer:
          'Não. Você escolhe o domínio e o nível, e a explicação de cada alternativa cobre o raciocínio por trás da resposta, não só o gabarito.',
      },
      {
        question: 'As questões repetem se eu treinar o mesmo domínio várias vezes?',
        answer:
          'Não. Cada rodada gera itens novos dentro do domínio escolhido, então dá para insistir no assunto mais difícil sem reencontrar o mesmo enunciado.',
      },
      {
        question: 'Como vocês verificam se o gabarito está certo?',
        answer:
          'Cada item passa por uma revisão de consistência antes de circular: alternativa única correta e coerência entre enunciado, gabarito e explicação.',
      },
      {
        question: 'Preciso de cartão de crédito para começar?',
        answer:
          'Não. As primeiras questões não pedem nem cadastro. A conta gratuita também não pede cartão e libera 100 questões por mês.',
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
          'O Acesso Condicional avalia sinais como localização, dispositivo e risco da sessão para decidir se exige MFA ou bloqueia o acesso. O Azure Policy trata de conformidade de recursos e a Managed Identity, de credenciais de aplicações. Ambos soam próximos, mas não avaliam o contexto do login.',
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
    heroHeadline: 'Questões de AZ-900 por área de habilidade, com a correção explicada',
    heroSubheadline:
      'Treine por área de habilidade do exame, com questões novas a cada rodada e a correção explicada alternativa por alternativa.',
    seoTitle: 'Simulado AZ-900 grátis com gabarito comentado | CertifiqueAI',
    seoDescription:
      'Questões de AZ-900 por área de habilidade do exame, com explicação de cada alternativa. As 10 primeiras são grátis e sem cadastro.',
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
      {
        question: 'Quantas questões tem o exame AZ-900?',
        answer:
          'Entre 40 e 60 questões, com 45 minutos de duração. O exame inclui formatos além da múltipla escolha simples, como correspondência e ordenação.',
      },
      {
        question: 'As questões repetem se eu treinar a mesma área várias vezes?',
        answer:
          'Não. Cada rodada gera itens novos dentro da área escolhida, então você pode voltar ao mesmo assunto quantas vezes precisar.',
      },
      {
        question: 'Como vocês verificam se o gabarito está certo?',
        answer:
          'Cada item passa por uma revisão de consistência antes de circular: alternativa única correta e coerência entre enunciado, gabarito e explicação.',
      },
      {
        question: 'Quanto custa depois das questões gratuitas?',
        answer:
          'O plano gratuito dá 100 questões por mês, sem cartão. O plano Pro custa R$29,90 por mês e sobe para 1000 questões.',
      },
    ],
  },
  {
    slug: 'oab',
    name: 'OAB',
    fullName: 'Exame da Ordem dos Advogados do Brasil, primeira fase',
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
          'A publicidade da advocacia é permitida com finalidade informativa e moderação, vedadas a mercantilização e a captação de clientela, inclusive o anúncio de valores, gratuidade ou forma de pagamento. A presença em redes sociais não é proibida; o que se regula é o conteúdo e o tom do anúncio.',
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
    heroHeadline: 'Questões de OAB no estilo FGV, com a explicação que o simulado não dá',
    heroSubheadline:
      'Escolha a matéria e receba questões no formato da FGV, com a explicação de cada alternativa. Descubra onde você perde ponto antes do dia da prova.',
    seoTitle: 'Simulado OAB 1ª fase com gabarito comentado | CertifiqueAI',
    seoDescription:
      'Questões de OAB primeira fase por matéria, no estilo FGV, com explicação de cada alternativa. As 10 primeiras são grátis e sem cadastro.',
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
        question: 'As questões seguem o formato da FGV?',
        answer:
          'Sim. Cada item nasce do conteúdo programático do edital vigente e sai no formato de quatro alternativas que a banca usa, com enunciado aplicado a caso concreto.',
      },
      {
        question: 'Quais matérias concentram mais questões?',
        answer:
          'Ética e Estatuto da OAB é a de maior peso, seguida de Direito Constitucional, Civil e Processual Civil. A distribuição da plataforma acompanha esses pesos.',
      },
      {
        question: 'As questões repetem se eu treinar a mesma matéria várias vezes?',
        answer:
          'Não. Cada rodada gera itens novos dentro da matéria escolhida, então dá para insistir na matéria mais fraca sem reencontrar o mesmo enunciado.',
      },
      {
        question: 'Quanto custa depois das questões gratuitas?',
        answer:
          'O plano gratuito dá 100 questões por mês, sem cartão. O plano Pro custa R$29,90 por mês e sobe para 1000 questões, com mais exames salvos.',
      },
    ],
  },
];

export const EXAM_LANDING_PAGE_MAP = new Map(EXAM_LANDING_PAGES.map((exam) => [exam.slug, exam]));
