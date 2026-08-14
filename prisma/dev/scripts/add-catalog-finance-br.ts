import { prisma } from '@/lib/prisma';

async function main() {
  console.log('Adding Brazilian financial market certification templates...');

  const anbima = await prisma.provider.upsert({
    where: { name: 'ANBIMA' },
    update: {},
    create: {
      name: 'ANBIMA',
      fullName: 'Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais',
      logoUrl:
        'https://www.anbima.com.br/lumis-theme/br/com/anbima/portal/theme/portal-anbima/assets/img/logo-anbima.png',
    },
  });

  const ancord = await prisma.provider.upsert({
    where: { name: 'ANCORD' },
    update: {},
    create: {
      name: 'ANCORD',
      fullName: 'Associação Nacional das Corretoras e Distribuidoras de Títulos e Valores Mobiliários',
      logoUrl: 'https://www.ancord.org.br/wp-content/themes/ancord/assets/images/logo-ancord.svg',
    },
  });

  const planejar = await prisma.provider.upsert({
    where: { name: 'PLANEJAR' },
    update: {},
    create: {
      name: 'PLANEJAR',
      fullName: 'Associação Brasileira de Planejadores Financeiros',
      logoUrl: 'https://framerusercontent.com/images/0mCuFuGOnN9T9Ux7ioZdPGcujw.png',
    },
  });

  const certs = [
    {
      name: 'CPA-10 — Certificação Profissional ANBIMA Série 10',
      key: 'CPA-10',
      year: 2025,
      totalQuestions: 50,
      examDurationMinutes: 90,
      passingScore: 70,
      providerId: anbima.id,
      sections: [
        { name: 'Sistema Financeiro Nacional e Participantes do Mercado', minQuestions: 5, maxQuestions: 5 },
        { name: 'Compliance, Ética e Análise do Perfil do Investidor', minQuestions: 10, maxQuestions: 10 },
        { name: 'Noções de Economia e Finanças', minQuestions: 15, maxQuestions: 15 },
        { name: 'Princípios de Investimento', minQuestions: 30, maxQuestions: 30 },
        { name: 'Fundos de Investimento', minQuestions: 20, maxQuestions: 20 },
        { name: 'Instrumentos de Renda Fixa e Renda Variável', minQuestions: 10, maxQuestions: 10 },
        { name: 'Previdência Complementar', minQuestions: 10, maxQuestions: 10 },
      ],
    },
    {
      name: 'CPA-20 — Certificação Profissional ANBIMA Série 20',
      key: 'CPA-20',
      year: 2025,
      totalQuestions: 60,
      examDurationMinutes: 150,
      passingScore: 70,
      providerId: anbima.id,
      sections: [
        { name: 'Sistema Financeiro Nacional e Participantes do Mercado', minQuestions: 5, maxQuestions: 10 },
        { name: 'Compliance, Ética e Análise do Perfil do Investidor', minQuestions: 15, maxQuestions: 25 },
        { name: 'Economia e Finanças', minQuestions: 5, maxQuestions: 10 },
        { name: 'Renda Fixa, Renda Variável e Derivativos', minQuestions: 17, maxQuestions: 25 },
        { name: 'Fundos de Investimento', minQuestions: 18, maxQuestions: 25 },
        { name: 'Previdência Complementar', minQuestions: 5, maxQuestions: 10 },
        { name: 'Mensuração e Gestão de Performance e Riscos', minQuestions: 10, maxQuestions: 20 },
      ],
    },
    {
      name: 'CEA — Certificação de Especialista em Investimentos ANBIMA',
      key: 'CEA',
      year: 2025,
      totalQuestions: 70,
      examDurationMinutes: 150,
      passingScore: 70,
      providerId: anbima.id,
      sections: [
        { name: 'Planejamento de Investimentos e API', minQuestions: 15, maxQuestions: 15 },
        { name: 'Fundos de Investimento', minQuestions: 15, maxQuestions: 15 },
        { name: 'Produtos de Renda Fixa', minQuestions: 15, maxQuestions: 15 },
        { name: 'Produtos de Renda Variável', minQuestions: 15, maxQuestions: 15 },
        { name: 'Derivativos', minQuestions: 10, maxQuestions: 10 },
        { name: 'Análise de Investimentos', minQuestions: 20, maxQuestions: 20 },
        { name: 'Finanças Pessoais e Planejamento de Aposentadoria', minQuestions: 10, maxQuestions: 10 },
      ],
    },
    {
      name: 'CFP — Planejador Financeiro Pessoal (PLANEJAR)',
      key: 'CFP-BR',
      year: 2025,
      totalQuestions: 140,
      examDurationMinutes: 420,
      passingScore: 70,
      providerId: planejar.id,
      sections: [
        { name: 'Planejamento Financeiro: Princípios, Processos e Habilidades', minQuestions: 13, maxQuestions: 13 },
        { name: 'Gestão Financeira', minQuestions: 15, maxQuestions: 15 },
        { name: 'Planejamento de Investimentos e Gestão de Ativos', minQuestions: 17, maxQuestions: 17 },
        { name: 'Planejamento da Aposentadoria', minQuestions: 12, maxQuestions: 12 },
        { name: 'Planejamento de Seguros e Gestão de Riscos', minQuestions: 12, maxQuestions: 12 },
        { name: 'Planejamento Tributário', minQuestions: 12, maxQuestions: 12 },
        { name: 'Planejamento Patrimonial e Sucessório', minQuestions: 12, maxQuestions: 12 },
        { name: 'Psicologia no Planejamento Financeiro', minQuestions: 7, maxQuestions: 7 },
      ],
    },
    {
      name: 'AAI — Agente Autônomo de Investimentos (ANCORD)',
      key: 'AAI',
      year: 2025,
      totalQuestions: 80,
      examDurationMinutes: 150,
      passingScore: 70,
      providerId: ancord.id,
      sections: [
        { name: 'Atividade do Assessor de Investimentos', minQuestions: 15, maxQuestions: 15 },
        { name: 'Prevenção à Lavagem de Dinheiro (PLD/AML)', minQuestions: 5, maxQuestions: 5 },
        { name: 'Economia', minQuestions: 2, maxQuestions: 2 },
        { name: 'Sistema Financeiro Nacional', minQuestions: 4, maxQuestions: 4 },
        { name: 'Instituições e Intermediadores Financeiros', minQuestions: 4, maxQuestions: 4 },
        { name: 'Administração de Risco', minQuestions: 5, maxQuestions: 5 },
        { name: 'Mercado de Capitais — Produtos e Modalidades Operacionais', minQuestions: 25, maxQuestions: 25 },
        { name: 'Fundos de Investimento', minQuestions: 5, maxQuestions: 5 },
        { name: 'Fundos de Investimento — Anexos CVM 175/23', minQuestions: 2, maxQuestions: 2 },
        { name: 'Securitização de Recebíveis', minQuestions: 1, maxQuestions: 1 },
        { name: 'Clubes de Investimentos', minQuestions: 3, maxQuestions: 3 },
        { name: 'Matemática Financeira', minQuestions: 5, maxQuestions: 5 },
        { name: 'Mercado Financeiro — Outros Produtos', minQuestions: 9, maxQuestions: 9 },
        { name: 'Mercados Derivativos', minQuestions: 15, maxQuestions: 15 },
      ],
    },
  ];

  for (const cert of certs) {
    const existing = await prisma.exam.findFirst({
      where: { name: cert.name, isTemplate: true },
    });
    if (existing) {
      console.log(`  Skipping (already exists): ${cert.name}`);
      continue;
    }
    const { sections, providerId, ...examData } = cert;
    await prisma.exam.create({
      data: {
        ...examData,
        type: 'certification',
        isTemplate: true,
        providerId,
        sections: { create: sections },
      },
    });
    console.log(`  Created: ${cert.name}`);
  }

  console.log('\nDone.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
