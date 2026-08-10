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
      examDurationMinutes: 75,
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
      examDurationMinutes: 120,
      passingScore: 70,
      providerId: anbima.id,
      sections: [
        { name: 'Sistema Financeiro Nacional e Participantes do Mercado', minQuestions: 5, maxQuestions: 5 },
        { name: 'Compliance, Ética e Análise do Perfil do Investidor', minQuestions: 10, maxQuestions: 10 },
        { name: 'Economia e Finanças', minQuestions: 5, maxQuestions: 5 },
        { name: 'Fundos de Investimento', minQuestions: 20, maxQuestions: 20 },
        { name: 'Instrumentos de Renda Fixa', minQuestions: 15, maxQuestions: 15 },
        { name: 'Instrumentos de Renda Variável', minQuestions: 15, maxQuestions: 15 },
        { name: 'Derivativos', minQuestions: 10, maxQuestions: 10 },
        { name: 'Análise de Investimentos', minQuestions: 10, maxQuestions: 10 },
        { name: 'Finanças Pessoais e Planejamento de Aposentadoria', minQuestions: 5, maxQuestions: 5 },
        { name: 'Investimentos no Exterior', minQuestions: 5, maxQuestions: 5 },
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
      totalQuestions: 170,
      examDurationMinutes: 360,
      passingScore: 65,
      providerId: planejar.id,
      sections: [
        { name: 'Processo de Planejamento Financeiro Pessoal', minQuestions: 8, maxQuestions: 8 },
        { name: 'Planejamento de Investimentos', minQuestions: 17, maxQuestions: 17 },
        { name: 'Planejamento Tributário', minQuestions: 14, maxQuestions: 14 },
        { name: 'Planejamento de Aposentadoria e Benefícios', minQuestions: 18, maxQuestions: 18 },
        { name: 'Planejamento Sucessório', minQuestions: 10, maxQuestions: 10 },
        { name: 'Gestão de Riscos e Seguros', minQuestions: 13, maxQuestions: 13 },
        { name: 'Psicologia do Planejamento Financeiro', minQuestions: 7, maxQuestions: 7 },
        { name: 'Fundamentos do Planejamento Financeiro', minQuestions: 13, maxQuestions: 13 },
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
        { name: 'Sistema Financeiro Nacional', minQuestions: 10, maxQuestions: 10 },
        { name: 'Mercado de Capitais', minQuestions: 20, maxQuestions: 20 },
        { name: 'Renda Fixa', minQuestions: 20, maxQuestions: 20 },
        { name: 'Renda Variável', minQuestions: 20, maxQuestions: 20 },
        { name: 'Derivativos e Produtos Estruturados', minQuestions: 10, maxQuestions: 10 },
        { name: 'Fundos de Investimento', minQuestions: 10, maxQuestions: 10 },
        { name: 'Compliance, Ética e Autorregulação', minQuestions: 10, maxQuestions: 10 },
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
