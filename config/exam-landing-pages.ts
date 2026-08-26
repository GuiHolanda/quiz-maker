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
    seoTitle: 'Simulado CEA grátis com gabarito comentado',
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
    seoTitle: 'Simulado CPA-20 grátis com gabarito comentado',
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
    seoTitle: 'Simulado AWS SAA-C03 com gabarito comentado',
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
    seoTitle: 'Simulado AWS Cloud Practitioner grátis',
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
    seoTitle: 'Simulado AZ-900 grátis com gabarito comentado',
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
    seoTitle: 'Simulado OAB 1ª fase com gabarito comentado',
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
  {
    slug: 'aws-developer-associate',
    demoExamName: 'AWS Certified Developer – Associate',
    name: 'AWS DVA-C02',
    fullName: 'AWS Certified Developer - Associate',
    provider: 'Amazon Web Services',
    examType: 'certification',
    totalQuestions: 65,
    examDurationMinutes: 130,
    passingScore: 72,
    topics: [
      { name: 'Desenvolvimento com Serviços AWS', weight: 32 },
      { name: 'Segurança', weight: 26 },
      { name: 'Implantação', weight: 24 },
      { name: 'Troubleshooting e Otimização', weight: 18 },
    ],
    sampleQuestions: [
      {
        topic: 'Desenvolvimento com Serviços AWS',
        stem: 'Você precisa criar uma aplicação que publique eventos de negócio e permita desacoplar produtores e consumidores, com baixo esforço operacional e integração nativa com outros serviços AWS. Qual serviço é a melhor escolha para emitir esses eventos de forma centralizada?',
        options: ['Amazon EventBridge', 'Amazon EC2 Auto Scaling', 'AWS CloudFormation', 'Amazon S3'],
        answerIndex: 0,
        explanation:
          'O Amazon EventBridge é ideal para roteamento e distribuição de eventos entre aplicações e serviços AWS, reduzindo o acoplamento entre componentes. EC2 Auto Scaling trata de capacidade computacional, CloudFormation é infraestrutura como código e S3 é armazenamento de objetos, então são distratores plausíveis, mas não resolvem o problema de eventos.',
      },
      {
        topic: 'Segurança',
        stem: 'Uma aplicação Lambda precisa acessar objetos em um bucket Amazon S3 usando permissões temporárias e sem armazenar credenciais de longo prazo no código. Qual é a abordagem recomendada?',
        options: [
          'Anexar uma role de execução do IAM à função Lambda com permissão para o bucket S3',
          'Inserir a AWS Access Key e a Secret Access Key diretamente nas variáveis de ambiente da função',
          'Criar um usuário IAM novo e embutir suas credenciais no pacote de implantação',
          'Compartilhar o bucket via ACL pública para reduzir a complexidade de autenticação',
        ],
        answerIndex: 0,
        explanation:
          'A função Lambda deve usar uma IAM role de execução, que fornece credenciais temporárias e segue o princípio do menor privilégio. Guardar chaves no código ou em variáveis de ambiente expõe credenciais de longo prazo, e tornar o bucket público é uma prática insegura e inadequada para este cenário.',
      },
    ],
    heroHeadline: 'Questões de DVA-C02 por domínio, explicadas alternativa por alternativa',
    heroSubheadline:
      'Treine com questões no estilo da prova AWS Certified Developer - Associate, com explicação de cada alternativa. Estude sem decorar gabarito e entenda exatamente como acertar de verdade.',
    seoTitle: 'Simulado AWS DVA-C02 grátis com gabarito comentado',
    seoDescription:
      'Faça as 10 primeiras questões grátis e sem cadastro. Treine para a AWS DVA-C02 com comentários detalhados.',
    faqs: [
      {
        question: 'Quantas questões tem a prova AWS Certified Developer - Associate (AWS DVA-C02)?',
        answer: 'A prova tem 65 questões.',
      },
      {
        question: 'Qual é a duração do exame AWS DVA-C02 e a nota mínima para aprovação?',
        answer: 'A duração é de 130 minutos e a nota de corte é 72%.',
      },
      {
        question: 'As questões do CertifiqueAI seguem o formato e os tópicos do edital?',
        answer:
          'Sim. As questões são criadas para refletir o estilo da AWS DVA-C02 e cobrir os tópicos do edital, com foco nos pesos informados.',
      },
      {
        question: 'As questões se repetem ou há novidades frequentes?',
        answer:
          'A proposta é manter questões novas e variadas, reduzindo a repetição para que você treine raciocínio e não memorização.',
      },
      {
        question: 'Como as questões e comentários são verificados?',
        answer:
          'Elas são elaboradas com base nos tópicos oficiais do exame e revisadas para manter coerência técnica, clareza e alinhamento com a AWS DVA-C02.',
      },
      {
        question: 'Quais tópicos têm maior peso na AWS DVA-C02?',
        answer:
          'Desenvolvimento com Serviços AWS tem 32% da prova, seguido por Segurança com 26%, Implantação com 24% e Troubleshooting e Otimização com 18%.',
      },
    ],
  },
  {
    slug: 'gcp-professional-cloud-architect',
    demoExamName: 'Google Cloud Professional Cloud Architect',
    name: 'GCP Professional Cloud Architect',
    fullName: 'Google Cloud Professional Cloud Architect',
    provider: 'Google Cloud',
    examType: 'certification',
    totalQuestions: 60,
    examDurationMinutes: 120,
    passingScore: 70,
    topics: [
      { name: 'Design de Arquitetura de Solução em Nuvem', weight: 25 },
      { name: 'Gestão e Provisionamento de Infraestrutura', weight: 18 },
      { name: 'Segurança e Compliance', weight: 18 },
      { name: 'Otimização de Processos Técnicos e de Negócio', weight: 15 },
      { name: 'Gestão de Implementação', weight: 12 },
      { name: 'Excelência Operacional', weight: 12 },
    ],
    sampleQuestions: [
      {
        topic: 'Design de Arquitetura de Solução em Nuvem',
        stem: 'Uma empresa quer executar uma aplicação web global com baixa latência para usuários em diferentes regiões. A solução deve escalar automaticamente e reduzir a necessidade de administração de infraestrutura. Qual opção é a mais adequada?',
        options: [
          'Implantar a aplicação em um grupo gerenciado de instâncias atrás de um balanceador de carga global',
          'Executar a aplicação em uma única VM em uma região central e usar DNS para direcionar os usuários',
          'Criar uma instância bare metal dedicada em cada país onde há usuários',
          'Usar apenas Cloud Storage para hospedar toda a aplicação dinâmica',
        ],
        answerIndex: 0,
        explanation:
          'Um grupo gerenciado de instâncias com balanceamento global atende à necessidade de escala automática, alta disponibilidade e menor esforço operacional. A opção de uma única VM é um gargalo e aumenta a latência. A alternativa com bare metal é excessiva e pouco prática para esse cenário. Cloud Storage, isoladamente, não executa lógica de aplicação dinâmica.',
      },
      {
        topic: 'Segurança e Compliance',
        stem: 'Uma equipe precisa garantir que apenas identidades autorizadas acessem um conjunto de recursos no Google Cloud, seguindo o princípio do menor privilégio. Qual recurso deve ser usado principalmente para controlar esse acesso?',
        options: ['Identity and Access Management (IAM)', 'Cloud DNS', 'Cloud Load Balancing', 'Cloud Logging'],
        answerIndex: 0,
        explanation:
          'O IAM é o serviço correto para controlar permissões com base em funções e aplicar o princípio do menor privilégio. Cloud DNS resolve nomes, Cloud Load Balancing distribui tráfego e Cloud Logging coleta registros; nenhum deles é o mecanismo principal de autorização.',
      },
    ],
    heroHeadline: 'Cenários novos de arquitetura GCP a cada rodada, com o motivo de cada escolha errada',
    heroSubheadline:
      'Treine com questões no estilo da prova oficial Google Cloud, com explicação de cada alternativa e foco no raciocínio, não na decoreba. Ideal para chegar à certificação com segurança e entender a lógica por trás das respostas.',
    seoTitle: 'Simulado GCP Professional Cloud Architect grátis',
    seoDescription:
      'Teste grátis: 10 primeiras questões sem cadastro, com gabarito comentado para GCP Professional Cloud Architect.',
    faqs: [
      {
        question: 'Quantas questões tem a prova Google Cloud Professional Cloud Architect?',
        answer: 'A prova tem 60 questões e duração total de 120 minutos.',
      },
      {
        question: 'Qual é a nota mínima para passar no exame?',
        answer: 'A nota de corte é 70%.',
      },
      {
        question: 'As questões seguem o edital da certificação?',
        answer:
          'Sim. As questões são distribuídas conforme os tópicos e pesos do exame, incluindo Design de Arquitetura de Solução em Nuvem (25%), Gestão e Provisionamento de Infraestrutura (18%), Segurança e Compliance (18%), Otimização de Processos Técnicos e de Negócio (15%), Gestão de Implementação (12%) e Excelência Operacional (12%).',
      },
      {
        question: 'As questões se repetem?',
        answer:
          'A proposta é gerar questões novas e variar os cenários para treinar diferentes formas de cobrança da mesma competência, reduzindo a dependência de memorização.',
      },
      {
        question: 'Como as questões são geradas e verificadas?',
        answer:
          'Elas são criadas para refletir o formato e o nível de dificuldade da prova, com base nos tópicos oficiais, e revisadas para manter a precisão técnica e a aderência ao exame.',
      },
      {
        question: 'Este simulado ajuda em quais áreas do GCP Professional Cloud Architect?',
        answer:
          'Ele cobre os principais domínios do exame, com destaque para design de arquitetura em nuvem, segurança, provisionamento de infraestrutura, otimização de soluções, implementação e excelência operacional.',
      },
    ],
  },
  {
    slug: 'comptia-security-plus',
    demoExamName: 'CompTIA Security+',
    name: 'CompTIA Security+',
    fullName: 'CompTIA Security+ (SY0-701)',
    provider: 'CompTIA',
    examType: 'certification',
    totalQuestions: 90,
    examDurationMinutes: 90,
    passingScore: 83,
    topics: [
      { name: 'Conceitos Gerais de Segurança', weight: 12 },
      { name: 'Ameaças, Vulnerabilidades e Mitigações', weight: 22 },
      { name: 'Arquitetura de Segurança', weight: 18 },
      { name: 'Operações de Segurança', weight: 28 },
      { name: 'Gestão de Programa de Segurança', weight: 20 },
    ],
    sampleQuestions: [
      {
        topic: 'Operações de Segurança',
        stem: 'Uma equipe de segurança identifica vários alertas de autenticações falhas em sequência, vindos do mesmo endereço IP, seguidos de um sucesso de login. Qual é a melhor ação imediata para reduzir o risco de um ataque de força bruta automatizado?',
        options: [
          'Bloquear temporariamente o endereço IP de origem e acionar controles de limitação de tentativas',
          'Alterar todas as senhas dos usuários afetados imediatamente',
          'Desativar o registro de logs para reduzir ruído operacional',
          'Aumentar o tempo limite de sessão para facilitar o acesso dos usuários',
        ],
        answerIndex: 0,
        explanation:
          'Bloquear temporariamente o IP e aplicar limitação de tentativas reduz a eficácia de ataques automatizados e ajuda a conter a atividade suspeita. A alternativa sobre trocar todas as senhas pode ser necessária em alguns cenários, mas não é a ação imediata mais direta para conter a fonte do ataque. Desativar logs piora a visibilidade, e aumentar timeout de sessão não mitiga força bruta.',
      },
      {
        topic: 'Ameaças, Vulnerabilidades e Mitigações',
        stem: 'Um usuário recebe um e-mail aparentemente legítimo do departamento financeiro, pedindo para revisar uma fatura em anexo. Ao abrir o arquivo, o computador passa a exibir comportamento anormal. Qual tipo de ameaça é mais provável nesse cenário?',
        options: [
          'Phishing com entrega de malware por anexo',
          'Ataque de negação de serviço distribuído',
          'Escalonamento de privilégios por falha de kernel',
          'Ataque de varredura de portas',
        ],
        answerIndex: 0,
        explanation:
          'O cenário descreve um e-mail fraudulento que induz o usuário a abrir um anexo malicioso, o que caracteriza phishing com entrega de malware. DDoS afeta disponibilidade de um serviço, não depende de anexo de e-mail. Escalonamento de privilégios por falha de kernel é uma técnica posterior de exploração, e varredura de portas é reconhecimento, não a infecção descrita.',
      },
    ],
    heroHeadline: 'Questões novas de Security+ todo dia, com o porquê de cada alternativa',
    heroSubheadline:
      'Treine com questões no estilo da prova CompTIA Security+ (SY0-701), com explicação de cada alternativa para você entender a lógica da resposta. Sem decorar gabarito: aprenda o conteúdo e avance com mais segurança.',
    seoTitle: 'Simulado CompTIA Security+ grátis com gabarito comentado',
    seoDescription: 'Teste grátis as 10 primeiras questões da CompTIA Security+ sem cadastro e com gabarito comentado.',
    faqs: [
      {
        question: 'Quantas questões tem a prova CompTIA Security+ (SY0-701)?',
        answer: 'A prova tem 90 questões.',
      },
      {
        question: 'Qual é a duração do exame CompTIA Security+ (SY0-701)?',
        answer: 'O exame tem duração de 90 minutos.',
      },
      {
        question: 'Qual é a nota de corte para aprovação no Security+ SY0-701?',
        answer: 'A nota de corte é 83%.',
      },
      {
        question: 'As questões do simulado seguem o formato e o edital do exame?',
        answer:
          'Sim. As questões são elaboradas para refletir os tópicos e pesos do edital do CompTIA Security+ (SY0-701), com nível de dificuldade compatível com a prova.',
      },
      {
        question: 'As questões se repetem com frequência?',
        answer:
          'Não. A proposta é gerar questões novas e variadas, para evitar memorização mecânica e reforçar a compreensão dos conceitos.',
      },
      {
        question: 'Como as questões são geradas e verificadas?',
        answer:
          'As questões são criadas com foco em aderência ao edital do exame e revisadas para manter correção técnica, clareza e fidelidade ao estilo da prova.',
      },
    ],
  },
  {
    slug: 'cisco-ccna',
    demoExamName: 'Cisco CCNA',
    name: 'Cisco CCNA',
    fullName: 'Cisco Certified Network Associate (200-301)',
    provider: 'Cisco',
    examType: 'certification',
    totalQuestions: 120,
    examDurationMinutes: 120,
    passingScore: 82,
    topics: [
      { name: 'Fundamentos de Redes', weight: 20 },
      { name: 'Acesso à Rede', weight: 20 },
      { name: 'Conectividade IP', weight: 25 },
      { name: 'Serviços IP', weight: 10 },
      { name: 'Fundamentos de Segurança', weight: 15 },
      { name: 'Automação e Programabilidade', weight: 10 },
    ],
    sampleQuestions: [
      {
        topic: 'Conectividade IP',
        stem: 'Um administrador precisa configurar um host com endereço IPv4 na rede 192.168.10.0/24. Qual máscara de sub-rede deve ser usada para esse prefixo?',
        options: ['255.255.255.0', '255.255.0.0', '255.255.255.128', '255.255.255.252'],
        answerIndex: 0,
        explanation:
          'O prefixo /24 corresponde à máscara 255.255.255.0. A alternativa 255.255.255.128 é uma distração plausível porque também é uma máscara comum, mas ela representa /25, dividindo a rede em duas sub-redes menores.',
      },
      {
        topic: 'Fundamentos de Segurança',
        stem: 'Qual recurso de segurança em um switch Cisco ajuda a limitar quais endereços MAC podem usar uma porta de acesso?',
        options: ['Port Security', 'DHCP Snooping', 'SPAN', 'NTP'],
        answerIndex: 0,
        explanation:
          'Port Security permite restringir ou aprender um número específico de endereços MAC por porta. DHCP Snooping protege contra servidores DHCP não autorizados, mas não controla diretamente os MACs permitidos na porta.',
      },
    ],
    heroHeadline: 'Treine para o CCNA sem repetir questão nenhuma vez',
    heroSubheadline:
      'Treine com questões inéditas no estilo do exame 200-301, com gabarito comentado e explicação de cada alternativa. Aprenda o conteúdo sem decorar respostas.',
    seoTitle: 'Simulado Cisco CCNA grátis com gabarito comentado',
    seoDescription: 'Faça 10 questões grátis, sem cadastro, e treine para o Cisco CCNA com gabarito comentado.',
    faqs: [
      {
        question: 'Quantas questões tem a prova Cisco CCNA (200-301)?',
        answer: 'A prova tem 120 questões.',
      },
      {
        question: 'Qual é a duração do exame Cisco CCNA?',
        answer: 'A duração total é de 120 minutos.',
      },
      {
        question: 'Qual é a nota de corte para passar no CCNA?',
        answer: 'A nota de corte é 82%.',
      },
      {
        question: 'As questões seguem o formato e o conteúdo do edital?',
        answer:
          'Sim. As questões são criadas para refletir os tópicos e pesos do edital do Cisco CCNA, cobrindo Fundamentos de Redes, Acesso à Rede, Conectividade IP, Serviços IP, Fundamentos de Segurança e Automação e Programabilidade.',
      },
      {
        question: 'As questões se repetem no simulado?',
        answer:
          'Não. A proposta é gerar questões novas e variar os enunciados e alternativas para treinar entendimento, não memorização.',
      },
      {
        question: 'Como as questões são elaboradas e verificadas?',
        answer:
          'Elas são formuladas com base nos tópicos oficiais do exame e revisadas para manter fidelidade técnica, nível de dificuldade e alinhamento ao que é cobrado no Cisco CCNA.',
      },
    ],
  },
  {
    slug: 'terraform-associate',
    demoExamName: 'HashiCorp Terraform Associate',
    name: 'Terraform Associate',
    fullName: 'HashiCorp Certified: Terraform Associate (004)',
    provider: 'HashiCorp',
    examType: 'certification',
    totalQuestions: 57,
    examDurationMinutes: 60,
    passingScore: 70,
    topics: [
      { name: 'Infraestrutura como Código com Terraform', weight: 12 },
      { name: 'Fundamentos do Terraform', weight: 13 },
      { name: 'Fluxo de Trabalho Principal', weight: 13 },
      { name: 'Configuração do Terraform', weight: 14 },
      { name: 'Módulos do Terraform', weight: 12 },
      { name: 'Gestão de Estado', weight: 14 },
      { name: 'Manutenção de Infraestrutura', weight: 13 },
      { name: 'HCP Terraform', weight: 9 },
    ],
    sampleQuestions: [
      {
        topic: 'Fluxo de Trabalho Principal',
        stem: 'Qual comando você deve usar para inicializar um diretório de trabalho do Terraform antes de executar outros comandos como plan e apply?',
        options: ['terraform init', 'terraform validate', 'terraform fmt', 'terraform refresh'],
        answerIndex: 0,
        explanation:
          'terraform init inicializa o diretório, baixa providers e prepara o backend. validate verifica a sintaxe, fmt formata arquivos e refresh atualiza o estado, mas nenhum deles substitui a inicialização do ambiente.',
      },
      {
        topic: 'Gestão de Estado',
        stem: 'Qual é a principal função do arquivo de estado do Terraform?',
        options: [
          'Armazenar a configuração em HCL',
          'Registrar o mapeamento entre recursos reais e recursos declarados',
          'Substituir o arquivo de variáveis',
          'Executar o provisionamento dos recursos',
        ],
        answerIndex: 1,
        explanation:
          'O state mantém o vínculo entre a infraestrutura real e os recursos gerenciados pelo Terraform. A alternativa sobre HCL é distratora porque a configuração fica nos arquivos .tf, não no state.',
      },
    ],
    heroHeadline: 'Questões de Terraform Associate no estilo do exame oficial, com a explicação que ele não dá',
    heroSubheadline:
      'Treine com questões inéditas no estilo da prova HashiCorp Certified: Terraform Associate (004), com explicação clara de cada alternativa. Estude sem decorar gabarito e entenda a lógica por trás do Terraform.',
    seoTitle: 'Simulado Terraform Associate grátis com gabarito comentado',
    seoDescription: 'Faça 10 questões grátis do Terraform Associate sem cadastro e com gabarito comentado.',
    faqs: [
      {
        question: 'Quantas questões tem a prova Terraform Associate (004)?',
        answer: 'A prova tem 57 questões e duração total de 60 minutos.',
      },
      {
        question: 'Qual é a nota mínima para passar no Terraform Associate?',
        answer: 'A nota de corte é 70%.',
      },
      {
        question: 'As questões seguem o edital do exame?',
        answer:
          'Sim. As questões são distribuídas pelos tópicos do edital, como Infraestrutura como Código com Terraform, Fundamentos, Fluxo de Trabalho Principal, Configuração, Módulos, Gestão de Estado, Manutenção de Infraestrutura e HCP Terraform.',
      },
      {
        question: 'As questões se repetem?',
        answer:
          'Não. A ideia é gerar questões novas para você treinar vários cenários sem depender de decorar respostas.',
      },
      {
        question: 'Como as questões são criadas e verificadas?',
        answer:
          'As questões são elaboradas para espelhar o estilo da certificação e passam por revisão técnica para manter alinhamento com os conceitos oficiais do Terraform.',
      },
      {
        question: 'O exame cobre HCP Terraform?',
        answer: 'Sim. HCP Terraform aparece no edital e representa 9% da prova.',
      },
    ],
  },
  {
    slug: 'cfa-level-1',
    demoExamName: 'CFA Level I',
    name: 'CFA Level I',
    fullName: 'Chartered Financial Analyst — Level I',
    provider: 'CFA Institute',
    examType: 'certification',
    totalQuestions: 180,
    examDurationMinutes: 270,
    passingScore: 65,
    topics: [
      { name: 'Ética e Padrões Profissionais', weight: 18 },
      { name: 'Métodos Quantitativos', weight: 7 },
      { name: 'Economia', weight: 7 },
      { name: 'Análise de Demonstrações Financeiras', weight: 12 },
      { name: 'Emissores Corporativos', weight: 7 },
      { name: 'Investimentos em Renda Variável', weight: 13 },
      { name: 'Renda Fixa', weight: 13 },
      { name: 'Derivativos', weight: 6 },
      { name: 'Investimentos Alternativos', weight: 7 },
      { name: 'Gestão de Portfólio', weight: 10 },
    ],
    sampleQuestions: [
      {
        topic: 'Ética e Padrões Profissionais',
        stem: 'Um analista recebeu um presente de pequeno valor de um fornecedor que também é uma potencial fonte de pesquisa para sua casa de análise. Segundo o Código e os Padrões de Conduta do CFA Institute, a atitude mais apropriada é:',
        options: [
          'Aceitar o presente, desde que ele seja de valor modesto e não influencie o julgamento profissional',
          'Recusar ou reportar o presente conforme a política da firma, especialmente se puder comprometer a independência e a objetividade',
          'Aceitar o presente apenas se ele não vier acompanhado de expectativa de recomendação favorável',
          'Aceitar o presente se o analista divulgar o fato posteriormente em relatório ao mercado',
        ],
        answerIndex: 1,
        explanation:
          'A resposta correta é recusar ou seguir a política da firma, porque presentes e benefícios podem comprometer a independência e a objetividade do profissional. A alternativa A parece plausível por falar em valor modesto, mas no CFA a análise não depende apenas do valor, e sim do potencial conflito e da percepção de influência. Divulgação posterior não corrige um possível comprometimento ético.',
      },
      {
        topic: 'Renda Fixa',
        stem: 'Um título com cupom fixo anual e pagamento semestral tem taxa de desconto de mercado acima de sua taxa de cupom. Considerando tudo o mais constante, o preço do título será:',
        options: [
          'Maior que o valor nominal',
          'Igual ao valor nominal',
          'Menor que o valor nominal',
          'Igual ao valor presente dos cupons apenas, sem considerar o principal',
        ],
        answerIndex: 2,
        explanation:
          'Quando a taxa de desconto exigida pelo mercado é maior que a taxa de cupom, os fluxos futuros são descontados mais fortemente e o título é negociado com desconto, ou seja, abaixo do valor nominal. A alternativa B seria correta apenas se a taxa de desconto fosse igual à taxa de cupom. A alternativa D é uma distratora comum, mas o preço de um título inclui tanto os cupons quanto o principal no vencimento.',
      },
    ],
    heroHeadline: 'Questões de CFA Level I por tópico, explicadas alternativa por alternativa',
    heroSubheadline:
      'Treine com questões no formato da prova do CFA Institute, alinhadas aos principais tópicos do edital e com explicação alternativa por alternativa. Aprenda a resolver de verdade, sem depender de decorar gabarito.',
    seoTitle: 'Simulado CFA Level I grátis com gabarito comentado',
    seoDescription:
      '10 primeiras questões grátis e sem cadastro. Treine CFA Level I com gabarito comentado e questões no formato da prova.',
    faqs: [
      {
        question: 'Quantas questões tem o CFA Level I?',
        answer: 'A prova tem 180 questões e duração total de 270 minutos.',
      },
      {
        question: 'Qual é a nota de corte para passar?',
        answer: 'A nota de corte informada é 65%.',
      },
      {
        question: 'As questões seguem o estilo e o conteúdo da prova?',
        answer:
          'Sim. As questões são elaboradas para refletir o nível e a distribuição de tópicos do CFA Level I, com foco nos conteúdos do edital e no formato de múltipla escolha.',
      },
      {
        question: 'As questões se repetem?',
        answer: 'Não. A proposta é oferecer questões novas, para ampliar a prática e evitar memorização de respostas.',
      },
      {
        question: 'Como vocês garantem a qualidade das questões?',
        answer:
          'As questões são criadas e revisadas para manter aderência técnica aos tópicos do exame, com explicações do gabarito e das alternativas para apoiar o estudo.',
      },
      {
        question: 'Quais são os tópicos mais importantes do CFA Level I?',
        answer:
          'Os maiores pesos são Ética e Padrões Profissionais, com 18%, e, em seguida, Investimentos em Renda Variável, Renda Fixa e Gestão de Portfólio, com 13%, 13% e 10%, respectivamente.',
      },
    ],
  },
  {
    slug: 'frm-part-1',
    demoExamName: 'FRM Part I',
    name: 'FRM Part I',
    fullName: 'Financial Risk Manager — Part I',
    provider: 'GARP',
    examType: 'certification',
    totalQuestions: 100,
    examDurationMinutes: 240,
    passingScore: 60,
    topics: [
      { name: 'Fundamentos de Gestão de Risco', weight: 20 },
      { name: 'Análise Quantitativa', weight: 20 },
      { name: 'Mercados e Produtos Financeiros', weight: 30 },
      { name: 'Modelos de Precificação e Risco', weight: 30 },
    ],
    sampleQuestions: [
      {
        topic: 'Modelos de Precificação e Risco',
        stem: 'Em um modelo de apreçamento por arbitragem, qual condição é essencial para que um ativo sem risco de arbitragem tenha preço consistente com o mercado?',
        options: [
          'O preço deve ser igual ao valor presente dos fluxos futuros descontados à taxa livre de risco ajustada ao prazo',
          'O preço deve ser igual ao maior preço observado entre ativos comparáveis',
          'O preço deve ser definido pela média simples dos preços históricos do ativo',
          'O preço deve ser igual ao custo histórico de aquisição do ativo',
        ],
        answerIndex: 0,
        explanation:
          'A lógica de precificação por arbitragem exige que o preço seja consistente com o valor presente dos fluxos esperados descontados adequadamente, evitando oportunidades de arbitragem. A alternativa B é uma distratora plausível, mas preço de mercado comparável não garante ausência de arbitragem. C e D confundem preço teórico com estatística histórica ou custo contábil, o que não é o critério do modelo.',
      },
      {
        topic: 'Mercados e Produtos Financeiros',
        stem: 'Qual das afirmações descreve corretamente um contrato futuro em comparação com um contrato a termo (forward)?',
        options: [
          'O futuro é padronizado e negociado em bolsa, com ajustes diários de margem',
          'O futuro é sempre negociado de forma privada e sem câmara de compensação',
          'O futuro não possui risco de contraparte em nenhuma circunstância',
          'O futuro é liquidado apenas no vencimento, como regra geral',
        ],
        answerIndex: 0,
        explanation:
          'Contratos futuros são padronizados, negociados em bolsa e normalmente marcados a mercado com ajustes diários de margem. A alternativa B descreve um forward, não um future. A C é incorreta porque o futuro reduz, mas não elimina por completo, o risco de contraparte. A D também está errada porque a liquidação diária é uma característica central dos futuros.',
      },
    ],
    heroHeadline: 'Cenários novos de risco a cada rodada de FRM Part I, com o motivo de cada resposta certa',
    heroSubheadline:
      'Treine com questões no estilo do exame FRM Part I, alinhadas aos tópicos cobrados pela GARP e com explicação de cada alternativa. Estude para entender a lógica da resposta, sem precisar decorar gabarito.',
    seoTitle: 'Simulado FRM Part I grátis com gabarito comentado',
    seoDescription:
      '10 primeiras questões grátis e sem cadastro. Treine FRM Part I com gabarito comentado e questões no estilo da prova.',
    faqs: [
      {
        question: 'Quantas questões tem o FRM Part I?',
        answer: 'O FRM Part I tem 100 questões de múltipla escolha.',
      },
      {
        question: 'Qual é o tempo de prova do FRM Part I?',
        answer: 'A duração total é de 240 minutos.',
      },
      {
        question: 'Qual é a nota de corte para aprovação?',
        answer: 'A nota de corte é 60%.',
      },
      {
        question: 'As questões seguem o formato e o conteúdo do edital?',
        answer:
          'Sim. As questões são elaboradas para refletir o estilo da prova e cobrir os tópicos do edital do FRM Part I, respeitando seus pesos.',
      },
      {
        question: 'As questões se repetem?',
        answer:
          'Não. A proposta é oferecer questões novas, para você praticar com variação de enunciados e alternativas.',
      },
      {
        question: 'Como as questões são geradas e verificadas?',
        answer:
          'As questões são produzidas com foco em aderência ao edital e revisadas para manter consistência técnica e alinhamento com a prova.',
      },
    ],
  },
  {
    slug: 'cfp',
    demoExamName: 'CFP — Planejador Financeiro Pessoal (PLANEJAR)',
    name: 'CFP',
    fullName: 'Certificação CFP — Planejador Financeiro Pessoal (PLANEJAR)',
    provider: 'PLANEJAR',
    examType: 'certification',
    totalQuestions: 140,
    examDurationMinutes: 420,
    passingScore: 70,
    topics: [
      { name: 'Planejamento Financeiro: Princípios, Processos e Habilidades', weight: 13 },
      { name: 'Gestão Financeira', weight: 15 },
      { name: 'Planejamento de Investimentos e Gestão de Ativos', weight: 17 },
      { name: 'Planejamento da Aposentadoria', weight: 12 },
      { name: 'Planejamento de Seguros e Gestão de Riscos', weight: 12 },
      { name: 'Planejamento Tributário', weight: 12 },
      { name: 'Planejamento Patrimonial e Sucessório', weight: 12 },
      { name: 'Psicologia no Planejamento Financeiro', weight: 7 },
    ],
    sampleQuestions: [
      {
        topic: 'Planejamento de Investimentos e Gestão de Ativos',
        stem: 'Em um processo de planejamento financeiro, qual prática é mais adequada para alinhar a carteira de investimentos ao perfil e aos objetivos do cliente?',
        options: [
          'Definir a alocação com base apenas no ativo de maior rentabilidade recente',
          'Construir a carteira considerando objetivo, prazo, tolerância a risco e necessidade de liquidez',
          'Escolher somente ativos de renda fixa para eliminar completamente o risco',
          'Manter a mesma composição da carteira para todos os clientes, independentemente do perfil',
        ],
        answerIndex: 1,
        explanation:
          'A alternativa correta é a B, porque uma carteira adequada deve ser estruturada de acordo com objetivos, horizonte de tempo, tolerância ao risco e necessidade de liquidez. Isso está no centro do planejamento de investimentos. A alternativa A é uma distratora plausível porque rentabilidade recente chama atenção, mas não é critério suficiente para decisão. A C é incorreta porque eliminar completamente o risco pode comprometer retorno e não atende a todos os objetivos. A D também está errada, pois a alocação deve ser personalizada.',
      },
      {
        topic: 'Gestão Financeira',
        stem: 'Ao analisar o orçamento de um cliente, qual indicador é mais útil para avaliar se a renda está sendo suficiente para cobrir as despesas recorrentes sem recorrer a endividamento?',
        options: [
          'Taxa de poupança',
          'Fluxo de caixa mensal',
          'Rentabilidade nominal dos investimentos',
          'Patrimônio líquido contábil',
        ],
        answerIndex: 1,
        explanation:
          'A alternativa correta é a B, porque o fluxo de caixa mensal mostra entradas e saídas de recursos no período e evidencia se as despesas recorrentes estão sendo pagas com a própria renda. A alternativa A é importante no planejamento, mas mede quanto é poupado, não a capacidade de cobertura das despesas. A C é uma medida de desempenho de investimentos e não de orçamento. A D mostra a posição patrimonial, mas não substitui a análise do caixa mensal.',
      },
    ],
    heroHeadline: 'Questões de CFP no estilo do exame PLANEJAR, com a explicação que o simulado não dá',
    heroSubheadline:
      'Treine com questões no formato da prova de Certificação CFP — Planejador Financeiro Pessoal (PLANEJAR), com explicação de cada alternativa. Sem decorar gabarito: você entende a lógica da resposta e chega mais preparado no dia do exame.',
    seoTitle: 'Simulado CFP grátis com gabarito comentado',
    seoDescription:
      '10 primeiras questões grátis e sem cadastro. Treine CFP com gabarito comentado no formato da prova.',
    faqs: [
      {
        question: 'Quantas questões tem a prova CFP?',
        answer:
          'A certificação CFP — Planejador Financeiro Pessoal (PLANEJAR) tem 140 questões no total, com duração de 420 minutos.',
      },
      {
        question: 'Qual é a nota mínima para aprovação?',
        answer: 'A nota de corte é 70%.',
      },
      {
        question: 'As questões seguem o formato e os temas do edital?',
        answer:
          'Sim. As questões são elaboradas para refletir o estilo da prova e os tópicos do edital, com foco nos pesos de cada área da certificação CFP.',
      },
      {
        question: 'As questões se repetem?',
        answer: 'Não. A proposta é gerar questões novas para ampliar o treino e evitar memorização de gabarito.',
      },
      {
        question: 'Como as questões são geradas e verificadas?',
        answer:
          'As questões são criadas com base nos tópicos do edital e revisadas para manter aderência conceitual, nível de dificuldade adequado e explicações claras para cada alternativa.',
      },
      {
        question: 'Quais são os temas mais cobrados na certificação CFP?',
        answer:
          'Os maiores pesos são Planejamento Financeiro: Princípios, Processos e Habilidades (13%), Gestão Financeira (15%) e Planejamento de Investimentos e Gestão de Ativos (17%).',
      },
    ],
  },
  {
    slug: 'cpa-10',
    demoExamName: 'CPA-10 — Certificação Profissional ANBIMA Série 10',
    name: 'CPA-10',
    fullName: 'Certificação Profissional ANBIMA Série 10',
    provider: 'ANBIMA',
    examType: 'certification',
    totalQuestions: 50,
    examDurationMinutes: 90,
    passingScore: 70,
    topics: [
      { name: 'Sistema Financeiro Nacional e Participantes do Mercado', weight: 5 },
      { name: 'Compliance, Ética e Análise do Perfil do Investidor', weight: 10 },
      { name: 'Noções de Economia e Finanças', weight: 15 },
      { name: 'Princípios de Investimento', weight: 30 },
      { name: 'Fundos de Investimento', weight: 20 },
      { name: 'Instrumentos de Renda Fixa e Renda Variável', weight: 10 },
      { name: 'Previdência Complementar', weight: 10 },
    ],
    sampleQuestions: [
      {
        topic: 'Princípios de Investimento',
        stem: 'Um investidor CPA-10 tem perfil conservador e busca uma aplicação com menor exposição a oscilações de mercado. Qual princípio de investimento está mais diretamente relacionado a essa decisão?',
        options: [
          'Relação entre risco e retorno',
          'Liquidez',
          'Diversificação',
          'Rentabilidade passada garante retorno futuro',
        ],
        answerIndex: 0,
        explanation:
          'A relação entre risco e retorno é o princípio que orienta a escolha de investimentos de acordo com a tolerância ao risco do investidor. Para um perfil conservador, faz sentido priorizar menor volatilidade, ainda que isso normalmente implique retorno potencial menor. A alternativa de diversificação é plausível porque também ajuda a reduzir risco, mas ela é uma técnica de gestão de carteira, não o princípio central descrito no enunciado.',
      },
      {
        topic: 'Fundos de Investimento',
        stem: 'Em um fundo de investimento, qual participante é responsável pela gestão da carteira, tomando as decisões de compra e venda dos ativos?',
        options: ['Administrador', 'Gestor', 'Custodiante', 'Distribuidor'],
        answerIndex: 1,
        explanation:
          'O gestor é o profissional ou instituição responsável pela tomada de decisão de investimento e pela gestão da carteira do fundo. O administrador é responsável pela estrutura e funções operacionais e regulatórias do fundo, enquanto o custodiante guarda e controla os ativos. A alternativa administrador é uma distratora clássica porque muitas pessoas confundem a função operacional com a de gestão.',
      },
    ],
    heroHeadline: 'Treine para o CPA-10 sem repetir questão nenhuma vez',
    heroSubheadline:
      'Treine com questões no formato da prova da Certificação Profissional ANBIMA Série 10 (CPA-10), com explicação clara de cada alternativa. Sem decorar gabarito: você entende o conteúdo e chega mais preparado para acertar na prova.',
    seoTitle: 'Simulado CPA-10 grátis com gabarito comentado',
    seoDescription: 'Simulado CPA-10 grátis: 10 primeiras questões sem cadastro e com gabarito comentado.',
    faqs: [
      {
        question: 'Quantas questões tem a prova CPA-10?',
        answer: 'A prova tem 50 questões e duração de 90 minutos.',
      },
      {
        question: 'Qual é a nota mínima para aprovação na CPA-10?',
        answer: 'A nota de corte é 70%.',
      },
      {
        question: 'As questões seguem o formato e os temas do edital?',
        answer:
          'Sim. As questões são elaboradas para refletir o estilo da prova e cobrir os tópicos do edital da CPA-10, com foco nos pesos de cada assunto.',
      },
      {
        question: 'As questões se repetem com frequência?',
        answer:
          'Não. A proposta é gerar questões novas para ampliar sua prática e evitar a simples memorização de respostas.',
      },
      {
        question: 'Como as questões são criadas e verificadas?',
        answer:
          'Elas são produzidas com base no edital da ANBIMA e revisadas para manter coerência técnica, dificuldade compatível e explicações objetivas.',
      },
      {
        question: 'Quais temas mais caem na CPA-10?',
        answer:
          'Os tópicos com maior peso são Princípios de Investimento, com 30% da prova, e Fundos de Investimento, com 20%.',
      },
    ],
  },
  {
    slug: 'aai-ancord',
    demoExamName: 'AAI — Agente Autônomo de Investimentos (ANCORD)',
    name: 'AAI',
    fullName: 'Agente Autônomo de Investimentos (ANCORD)',
    provider: 'ANCORD',
    examType: 'certification',
    totalQuestions: 80,
    examDurationMinutes: 150,
    passingScore: 70,
    topics: [
      { name: 'Atividade do Assessor de Investimentos', weight: 15 },
      { name: 'Prevenção à Lavagem de Dinheiro (PLD/AML)', weight: 5 },
      { name: 'Mercado de Capitais — Produtos e Modalidades Operacionais', weight: 25 },
      { name: 'Mercados Derivativos', weight: 15 },
      { name: 'Mercado Financeiro — Outros Produtos', weight: 9 },
      { name: 'Administração de Risco', weight: 5 },
      { name: 'Fundos de Investimento', weight: 5 },
      { name: 'Matemática Financeira', weight: 5 },
      { name: 'Sistema Financeiro Nacional', weight: 4 },
      { name: 'Instituições e Intermediadores Financeiros', weight: 4 },
      { name: 'Clubes de Investimentos', weight: 3 },
      { name: 'Fundos de Investimento — Anexos CVM 175/23', weight: 2 },
      { name: 'Economia', weight: 2 },
      { name: 'Securitização de Recebíveis', weight: 1 },
    ],
    sampleQuestions: [
      {
        topic: 'Mercado de Capitais — Produtos e Modalidades Operacionais',
        stem: 'Um investidor deseja comprar ações por meio de uma ordem que só deve ser executada ao preço que ele indicar ou melhor. Qual tipo de ordem melhor atende a esse objetivo?',
        options: ['Ordem limitada', 'Ordem a mercado', 'Ordem casada', 'Ordem discricionária'],
        answerIndex: 0,
        explanation:
          'A ordem limitada só é executada ao preço especificado pelo investidor ou em condição melhor, o que corresponde exatamente ao enunciado. A ordem a mercado prioriza execução imediata e não garante preço. A ordem casada e a discricionária não descrevem esse controle de preço.',
      },
      {
        topic: 'Atividade do Assessor de Investimentos',
        stem: 'Em relação à atuação do Assessor de Investimentos, qual alternativa está correta?',
        options: [
          'Pode recomendar produtos e auxiliar o cliente, sem executar ordens por conta própria fora das regras aplicáveis.',
          'Pode administrar discricionariamente a carteira do cliente, escolhendo operações sem autorização prévia.',
          'Pode garantir rentabilidade mínima ao investidor em qualquer produto recomendado.',
          'Pode captar recursos do público em nome próprio para ofertar investimentos ao cliente.',
        ],
        answerIndex: 0,
        explanation:
          'O assessor de investimentos atua na prospecção, orientação e recomendação, sempre dentro dos limites regulatórios e da autorização do cliente. A administração discricionária da carteira é de outra natureza e exige estrutura própria, então a alternativa 2 está errada. Também é vedado prometer rentabilidade garantida ou captar recursos em nome próprio como descrito nas alternativas 3 e 4.',
      },
    ],
    heroHeadline: 'Questões novas de AAI todo dia, com o porquê de cada alternativa',
    heroSubheadline:
      'Treine para o exame de Agente Autônomo de Investimentos (ANCORD) com questões no formato da prova e explicações objetivas em cada resposta. Sem decorar gabarito: você entende a lógica, revisa o edital e chega mais confiante.',
    seoTitle: 'Simulado AAI grátis com gabarito comentado',
    seoDescription:
      '10 primeiras questões grátis e sem cadastro. Treine para AAI com gabarito comentado e questões no estilo da prova.',
    faqs: [
      {
        question: 'Quantas questões tem a prova de AAI?',
        answer: 'A prova do Agente Autônomo de Investimentos (ANCORD) tem 80 questões e duração de 150 minutos.',
      },
      {
        question: 'Qual é a nota mínima para aprovação?',
        answer: 'A nota de corte é 70%.',
      },
      {
        question: 'As questões seguem o formato do exame oficial?',
        answer:
          'Sim. O conteúdo é organizado para refletir os tópicos e pesos do edital da ANCORD, com questões de múltipla escolha no estilo cobrado na prova.',
      },
      {
        question: 'As questões se repetem?',
        answer:
          'Não. A proposta é gerar questões novas para ampliar a prática e evitar que você dependa de memorização de respostas.',
      },
      {
        question: 'Como as questões são geradas e verificadas?',
        answer:
          'As questões são elaboradas para ficar aderentes ao edital e passam por revisão de conteúdo para manter precisão técnica, clareza e fidelidade ao tema cobrado.',
      },
      {
        question: 'Quais são os temas mais importantes da prova?',
        answer:
          'Os tópicos de maior peso são Mercado de Capitais — Produtos e Modalidades Operacionais, com 25% da prova, e Atividade do Assessor de Investimentos, com 15%, além de Mercados Derivativos, também com 15%.',
      },
    ],
  },
];

export const EXAM_LANDING_PAGE_MAP = new Map(EXAM_LANDING_PAGES.map((exam) => [exam.slug, exam]));
